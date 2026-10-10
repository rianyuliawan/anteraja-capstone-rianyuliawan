<?php

namespace App\Services;

use App\Models\Dataset\Shipment;
use App\Models\Dataset\ShipmentPublicSummary;
use App\Models\Dataset\ShipmentTemperatureHistory;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CapstoneTrackingService
{
    public function search(array $awbs): array
    {
        if ($awbs === []) {
            return [];
        }

        $sortedAwbs = $awbs;
        sort($sortedAwbs, SORT_STRING);
        $key = 'tracking:v1:search:'.hash('sha256', implode(',', $sortedAwbs));

        return Cache::remember($key, 60, fn (): array => $this->searchFromDatabase($awbs));
    }

    private function searchFromDatabase(array $awbs): array
    {
        $rows = ShipmentPublicSummary::query()->from('shipment_public_summary as p')
            ->join('shipments as s', 's.id', '=', 'p.shipment_id')
            ->whereIn('p.awb', $awbs)
            ->select('p.*', 's.pickup_point', 's.delivery_point')
            ->get();

        $results = [];
        foreach ($rows as $row) {
            $results[$row->awb] = $this->summary($row);
        }

        return $results;
    }

    public function find(string $awb): ?array
    {
        return Cache::remember(self::detailCacheKey($awb), 60, fn (): ?array => $this->findFromDatabase($awb));
    }

    private function findFromDatabase(string $awb): ?array
    {
        // Keep independent detail sections in one PostgreSQL query.
        // PostgreSQL aggregates each section separately, so joins cannot multiply rows.
        $latestEvent = DB::table('shipment_events as e')
            ->select('e.stage as current_stage', 'e.event_code as current_event_code',
                'e.occurred_at as last_stage_at', 'e.completed_stop_order')
            ->whereColumn('e.shipment_id', 's.id')
            ->orderByDesc('e.occurred_at')->orderByDesc('e.id')->limit(1);

        $row = Shipment::query()->from('shipments as s')
            ->leftJoinLateral($latestEvent, 'current_event')
            ->where('s.awb', $awb)
            ->select('s.id as shipment_id', 's.awb', 's.pickup_point', 's.delivery_point',
                'current_event.current_stage', 'current_event.current_event_code',
                'current_event.last_stage_at', 'current_event.completed_stop_order')
            ->selectRaw('mask_public_name(s.sender_name) as sender_name_masked,
                mask_public_name(s.recipient_name) as recipient_name_masked')
            ->selectRaw(<<<'SQL'
                (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'id', rs.id, 'display_name', rs.display_name,
                    'latitude', rs.latitude, 'longitude', rs.longitude
                ) ORDER BY rs.stop_order), '[]'::jsonb)
                FROM route_stops rs WHERE rs.shipment_id = s.id) AS route_points_json
                SQL)
            ->selectRaw(<<<'SQL'
                (SELECT COALESCE(jsonb_agg(to_jsonb(t)
                    ORDER BY t.occurred_at DESC, t.shipment_event_id DESC), '[]'::jsonb)
                FROM shipment_public_timeline t WHERE t.shipment_id = s.id) AS events_json
                SQL)
            ->selectRaw(<<<'SQL'
                (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'id', a.id, 'segment', a.segment, 'ended_at', a.ended_at,
                    'asset_code', ta.asset_code, 'display_name', ta.display_name,
                    'normal_low_c', p.normal_low_c, 'normal_high_c', p.normal_high_c,
                    'basis_type', to_jsonb(p)->>'basis_type', 'source_url', p.source_url,
                    'temperature_c', latest.temperature_c,
                    'observed_at', latest.observed_at
                ) ORDER BY a.started_at, a.id), '[]'::jsonb)
                FROM shipment_asset_assignments a
                JOIN thermal_assets ta ON ta.id = a.thermal_asset_id
                JOIN temperature_profiles p ON p.asset_type = ta.asset_type
                LEFT JOIN LATERAL (
                    SELECT sample.temperature_c, sample.observed_at
                    FROM shipment_temperature_samples sample
                    WHERE sample.assignment_id = a.id
                    ORDER BY sample.observed_at DESC, sample.temperature_reading_id DESC LIMIT 1
                ) latest ON true
                WHERE a.shipment_id = s.id) AS assignments_json
                SQL)
            ->selectRaw(<<<'SQL'
                (SELECT jsonb_build_object(
                    'reading_count', COUNT(*), 'min_c', MIN(h.temperature_c),
                    'max_c', MAX(h.temperature_c),
                    'average_c', ROUND(AVG(h.temperature_c), 2)
                ) FROM shipment_temperature_history h
                WHERE h.shipment_id = s.id) AS analysis_json
                SQL)
            ->selectRaw(<<<'SQL'
                (SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY m.media_id), '[]'::jsonb)
                FROM shipment_public_event_media m
                WHERE m.shipment_id = s.id) AS media_json
                SQL)
            ->first();

        if (! $row) {
            return null;
        }

        $shipment = $this->summary($row);

        $stops = collect(json_decode($row->route_points_json));
        $points = $stops->map(fn ($stop) => [
            'id' => (string) $stop->id,
            'label' => $stop->display_name,
            'latitude' => round((float) $stop->latitude, 6),
            'longitude' => round((float) $stop->longitude, 6),
        ])->all();
        $shipment['route'] = [
            'completedIndex' => min((int) ($row->completed_stop_order ?? 0), max(count($points) - 1, 0)),
            'points' => $points,
        ];

        $events = collect(json_decode($row->events_json));
        $shipment['events'] = $events->map(fn ($event) => [
            'id' => (string) $event->shipment_event_id,
            'status' => $this->stageLabel($event->stage),
            'title' => $this->eventLabel($event->event_code),
            'description' => $this->eventDescription($event),
            'occurredAt' => $this->isoDate($event->occurred_at),
        ])->all();
        if ($events->isNotEmpty()) {
            $shipment['latestDescription'] = $this->eventDescription($events->first());
        }

        $assignments = collect(json_decode($row->assignments_json));
        $segmentNames = [
            'PICKUP' => 'Penjemputan awal',
            'AT_HUB' => 'Penyimpanan hub',
            'IN_TRANSIT' => 'Perjalanan antarthub',
            'AT_STAGING' => 'Penyimpanan titik distribusi',
            'LAST_MILE' => 'Pengantaran akhir',
        ];
        $shipment['segments'] = array_map(static fn ($assignment) => [
            'id' => (string) $assignment->id,
            'asset' => $assignment->display_name,
            'description' => $segmentNames[$assignment->segment] ?? $assignment->segment,
            'valueC' => $assignment->temperature_c === null
                ? null : round((float) $assignment->temperature_c, 2),
            'state' => $assignment->ended_at === null ? 'active' : 'complete',
        ], $assignments->all());

        $last = $assignments->last();
        $shipment['temperature'] = [
            'asset' => $last?->display_name ?? 'Belum ditugaskan',
            'assetCode' => $last?->asset_code ?? '—',
            'valueC' => $last?->temperature_c === null || $last === null
                ? null : round((float) $last->temperature_c, 2),
            'normalLowC' => $last === null ? -8.0 : round((float) $last->normal_low_c, 2),
            'normalHighC' => $last === null ? -2.0 : round((float) $last->normal_high_c, 2),
            'basisType' => $last?->basis_type ?? ($last?->source_url ? 'PUBLIC_CLAIM' : 'SIMULATION'),
            'sourceUrl' => $last?->source_url,
            'observedAt' => $this->isoDate($last?->observed_at),
            'nextUpdateAt' => null,
        ];

        // Aggregate all assigned readings in SQL. Table rows are loaded separately
        // only when the user opens the history.
        $shipment['temperatureAnalysis'] = $this->formatAnalysis(json_decode($row->analysis_json));

        $media = collect(json_decode($row->media_json))->keyBy('shipment_event_id');
        $shipment['pickup'] = null;
        $shipment['delivery'] = null;
        foreach ($events as $event) {
            if (! in_array($event->event_code, ['PICKED_UP', 'DELIVERED'], true)) {
                continue;
            }
            $key = $event->event_code === 'PICKED_UP' ? 'pickup' : 'delivery';
            $photo = $media->get($event->shipment_event_id);
            $imageUrl = $photo && Storage::disk('local')->exists($photo->storage_key)
                ? '/api/shipments/'.rawurlencode($awb).'/media/'.$photo->media_id
                : null;
            $shipment[$key] = [
                'imageUrl' => $imageUrl,
                'occurredAt' => $this->isoDate($event->occurred_at),
                'courier' => $event->courier_display_name ?: 'Petugas Anteraja',
                'party' => $key === 'pickup'
                    ? $shipment['sender']
                    : ($event->received_by_masked ?: $shipment['recipient']),
                'note' => $event->placement_note ?: $this->eventDescription($event),
                'location' => $key === 'pickup' ? $shipment['origin'] : $shipment['destination'],
            ];
        }

        return $shipment;
    }

    public function temperatureAnalysis(string $awb): ?array
    {
        $shipmentId = Shipment::query()->where('awb', $awb)->value('id');

        return $shipmentId === null ? null : $this->analysisForShipment((int) $shipmentId);
    }

    public function temperatureReadings(string $awb): ?array
    {
        return Cache::remember(self::readingsCacheKey($awb), 60, fn (): ?array => $this->readingsFromDatabase($awb));
    }

    private function readingsFromDatabase(string $awb): ?array
    {
        $shipmentId = Shipment::query()->where('awb', $awb)->value('id');
        if ($shipmentId === null) {
            return null;
        }

        $readings = ShipmentTemperatureHistory::query()
            ->where('shipment_id', $shipmentId)
            ->select(['temperature_reading_id', 'asset_code', 'temperature_c',
                'observed_at'])
            ->orderByDesc('observed_at')
            ->orderBy('temperature_reading_id', 'desc')
            ->get();

        return [
            'readings' => $readings->map(fn ($reading) => [
                'id' => (string) $reading->temperature_reading_id,
                'asset' => $reading->asset_code,
                'valueC' => round((float) $reading->temperature_c, 2),
                'observedAt' => $this->isoDate($reading->observed_at),
            ])->all(),
        ];
    }

    public static function detailCacheKey(string $awb): string
    {
        return 'tracking:v3:detail:'.hash('sha256', strtoupper($awb));
    }

    public static function readingsCacheKey(string $awb): string
    {
        return 'tracking:v3:readings:'.hash('sha256', strtoupper($awb));
    }

    public static function forgetCachedShipment(string $awb): void
    {
        Cache::forget(self::detailCacheKey($awb));
        Cache::forget(self::readingsCacheKey($awb));
    }

    private function analysisForShipment(int $shipmentId): array
    {
        // Use the assignment-aware view so one asset reading is counted only
        // when this shipment was actually assigned to that asset.
        $row = ShipmentTemperatureHistory::query()
            ->where('shipment_id', $shipmentId)
            ->selectRaw('COUNT(*) AS reading_count,
                MIN(temperature_c) AS min_c,
                MAX(temperature_c) AS max_c,
                ROUND(AVG(temperature_c), 2) AS average_c')
            ->first();

        return $this->formatAnalysis($row);
    }

    private function formatAnalysis(?object $row): array
    {
        return [
            'readingCount' => (int) ($row->reading_count ?? 0),
            'minimumC' => ($row->min_c ?? null) === null ? null : round((float) $row->min_c, 2),
            'maximumC' => ($row->max_c ?? null) === null ? null : round((float) $row->max_c, 2),
            'averageC' => ($row->average_c ?? null) === null ? null : round((float) $row->average_c, 2),
        ];
    }

    private function summary(object $row): array
    {
        $stage = $row->current_stage;
        $code = $row->current_event_code;

        return [
            'awb' => $row->awb,
            'stage' => $stage,
            'status' => $this->stageLabel($stage),
            'sender' => $row->sender_name_masked ?: '—',
            'recipient' => $row->recipient_name_masked ?: '—',
            'origin' => $row->pickup_point,
            'destination' => $row->delivery_point,
            'latestDescription' => $code
                ? $this->eventLabel($code).'.' : 'Belum ada kejadian pengiriman.',
            'lastEventAt' => $this->isoDate($row->last_stage_at),
        ];
    }

    private function isoDate(?string $value): ?string
    {
        return $value === null ? null : CarbonImmutable::parse($value)->toIso8601String();
    }

    private function stageLabel(?string $stage): string
    {
        return match ($stage) {
            'PICKED_UP' => 'Paket diambil',
            'AT_HUB' => 'Tiba di hub',
            'IN_TRANSIT' => 'Dalam perjalanan',
            'AT_STAGING' => 'Tiba di titik distribusi',
            'OUT_FOR_DELIVERY' => 'Sedang diantar',
            'DELIVERED' => 'Terkirim',
            default => 'Menunggu pembaruan',
        };
    }

    private function eventLabel(string $code): string
    {
        return match ($code) {
            'PICKED_UP' => 'Paket diambil dari pengirim',
            'ARRIVED_HUB' => 'Paket tiba di hub',
            'LEFT_HUB' => 'Paket berangkat dari hub',
            'IN_TRANSIT' => 'Paket dalam perjalanan',
            'ARRIVED_STAGING' => 'Paket tiba di titik distribusi',
            'OUT_FOR_DELIVERY' => 'Kurir membawa paket ke tujuan',
            'DELIVERED' => 'Paket diterima',
            default => 'Perjalanan paket diperbarui',
        };
    }

    private function eventDescription(object $event): string
    {
        $facility = $event->facility_name ?? $event->hub_name ?? null;
        $courier = $event->courier_display_name;

        return match ($event->event_code) {
            'PICKED_UP' => $courier
                ? 'Paket diterima kurir pickup '.rtrim($courier, '.').'.'
                : 'Paket telah dijemput dari pengirim.',
            'ARRIVED_HUB' => $facility
                ? "Paket diterima di {$facility} untuk proses transit dingin."
                : 'Paket telah tiba di hub transit.',
            'LEFT_HUB' => $facility
                ? "Paket berangkat dari {$facility} menuju titik berikutnya."
                : 'Paket berangkat menuju titik berikutnya.',
            'ARRIVED_STAGING' => $facility
                ? "Paket tiba di {$facility} dan menunggu pengantaran terakhir."
                : 'Paket tiba di titik distribusi terdekat.',
            'OUT_FOR_DELIVERY' => $courier
                ? 'Kurir '.rtrim($courier, '.').' sedang membawa paket ke tujuan.'
                : 'Kurir sedang membawa paket ke tujuan.',
            'DELIVERED' => $event->placement_note
                ?: ('Paket telah diterima oleh '.($event->received_by_masked ?: 'penerima').'.'),
            default => 'Pergerakan paket telah dicatat.',
        };
    }
}
