<?php

namespace App\Services;

use App\Models\Dataset\ShipmentTemperatureHistory;
use App\Models\Dataset\TemperatureReading;
use App\Models\Dataset\ThermalAsset;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class DatasetTemperatureService
{
    public function save(array $readings): array
    {
        $codes = array_unique(array_column($readings, 'asset_code'));
        $assets = ThermalAsset::query()->with('profile')
            ->where('is_active', true)->whereIn('asset_code', $codes)->get()
            ->keyBy('asset_code');

        $prepared = [];
        foreach ($readings as $reading) {
            $asset = $assets->get($reading['asset_code']);
            if (! $asset) {
                throw ValidationException::withMessages(['asset_code' => 'Aset tidak ditemukan atau tidak aktif.']);
            }
            $observedAt = CarbonImmutable::parse($reading['observed_at']);
            if ($observedAt->greaterThan(CarbonImmutable::now()->addMinutes(5))) {
                throw ValidationException::withMessages(['observed_at' => 'Waktu pembacaan tidak boleh di masa depan.']);
            }
            if ($observedAt->lessThan(CarbonImmutable::now()->subDays(7))) {
                throw ValidationException::withMessages(['observed_at' => 'Pembacaan lebih dari 7 hari tidak diterima.']);
            }

            $value = round((float) $reading['temperature_c'], 2);
            $prepared[] = [
                'thermal_asset_id' => $asset->id,
                'source' => 'NODE_RED',
                'message_id' => $reading['message_id'],
                'trigger_type' => 'SCHEDULED',
                'observed_at' => $observedAt->utc()->format('Y-m-d H:i:s.uP'),
                'temperature_c' => $value,
                'temperature_status' => $this->status($value, $asset->profile),
            ];
        }

        $result = (new TemperatureReading)->getConnection()->transaction(function () use ($prepared) {
            $columns = ['id', 'thermal_asset_id', 'message_id', 'temperature_c', 'observed_at', 'temperature_status'];

            $messageIds = array_column($prepared, 'message_id');
            $existing = TemperatureReading::query()
                ->where('source', 'NODE_RED')
                ->whereIn('message_id', $messageIds)
                ->get($columns)
                ->keyBy('message_id');

            $toInsert = [];
            $resultsByMessage = [];

            foreach ($prepared as $reading) {
                $msg = $reading['message_id'];
                $row = $existing->get($msg);

                if ($row !== null) {
                    $this->assertIdentical($row, $reading);
                    $resultsByMessage[$msg] = [
                        'id' => (int) $row->id,
                        'message_id' => $msg,
                        'temperature_status' => $row->temperature_status,
                        'duplicate' => true,
                    ];

                    continue;
                }

                $toInsert[] = $reading;
            }

            if ($toInsert !== []) {
                TemperatureReading::query()->insertOrIgnore($toInsert);

                $newIds = array_column($toInsert, 'message_id');
                $insertedRows = TemperatureReading::query()
                    ->where('source', 'NODE_RED')
                    ->whereIn('message_id', $newIds)
                    ->get($columns)
                    ->keyBy('message_id');

                foreach ($toInsert as $reading) {
                    $msg = $reading['message_id'];
                    $row = $insertedRows->get($msg);
                    $resultsByMessage[$msg] = $row !== null ? [
                        'id' => (int) $row->id,
                        'message_id' => $msg,
                        'temperature_status' => $row->temperature_status,
                        'duplicate' => false,
                    ] : [
                        'id' => 0,
                        'message_id' => $msg,
                        'temperature_status' => null,
                        'duplicate' => true,
                    ];
                }
            }

            $results = [];
            $inserted = 0;
            foreach ($prepared as $reading) {
                $entry = $resultsByMessage[$reading['message_id']];
                if (! $entry['duplicate']) {
                    $inserted++;
                }
                $results[] = $entry;
            }

            return [
                'inserted' => $inserted,
                'duplicates' => count($prepared) - $inserted,
                'readings' => $results,
            ];
        });

        $insertedIds = array_column(array_filter(
            $result['readings'],
            static fn (array $reading): bool => ! $reading['duplicate']
        ), 'id');

        if ($insertedIds !== []) {
            $awbs = ShipmentTemperatureHistory::query()
                ->from('shipment_temperature_history as history')
                ->join('shipments as shipment', 'shipment.id', '=', 'history.shipment_id')
                ->whereIn('history.temperature_reading_id', $insertedIds)
                ->distinct()
                ->pluck('shipment.awb');

            foreach ($awbs as $awb) {
                CapstoneTrackingService::forgetCachedShipment($awb);
            }
        }

        return $result;
    }

    private function assertIdentical(object $row, array $reading): void
    {
        $same = (int) $row->thermal_asset_id === (int) $reading['thermal_asset_id']
            && round((float) $row->temperature_c, 2) === round((float) $reading['temperature_c'], 2)
            && CarbonImmutable::parse($row->observed_at)->equalTo(CarbonImmutable::parse($reading['observed_at']));

        if (! $same) {
            throw ValidationException::withMessages(['message_id' => 'message_id sudah dipakai untuk pembacaan lain.']);
        }
    }

    private function status(float $value, object $profile): string
    {
        if ($value >= (float) $profile->normal_low_c && $value <= (float) $profile->normal_high_c) {
            return 'NORMAL';
        }
        if ($value >= (float) $profile->warning_low_c && $value <= (float) $profile->warning_high_c) {
            return 'WARNING';
        }

        return 'CRITICAL';
    }
}
