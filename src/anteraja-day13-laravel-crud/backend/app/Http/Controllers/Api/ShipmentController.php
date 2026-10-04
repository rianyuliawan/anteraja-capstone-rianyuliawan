<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\TemperatureReading;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ShipmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Shipment::query()->with(['courier', 'thermalAsset'])->latest();
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        return response()->json(['shipments' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $shipment = Shipment::create($request->validate($this->rules()));

        return response()->json(['shipment' => $shipment->load(['courier', 'thermalAsset'])], 201);
    }

    public function show(Shipment $shipment): JsonResponse
    {
        return response()->json(['shipment' => $shipment->load(['courier', 'thermalAsset'])]);
    }

    public function update(Request $request, Shipment $shipment): JsonResponse
    {
        $shipment->update($request->validate($this->rules($shipment)));

        return response()->json(['shipment' => $shipment->fresh()->load(['courier', 'thermalAsset'])]);
    }

    public function destroy(Shipment $shipment): JsonResponse
    {
        $shipment->delete();

        return response()->json([], 204);
    }

    public function search(Request $request): JsonResponse
    {
        $raw = $request->query('awbs', '');
        if (! is_string($raw)) {
            return response()->json(['message' => 'Parameter awbs harus berupa teks.'], 422);
        }
        $awbs = array_values(array_unique(array_filter(array_map('trim', explode(',', strtoupper($raw))))));
        if (count($awbs) > 10) {
            return response()->json(['message' => 'Maksimal 10 nomor resi.'], 422);
        }
        $shipments = Shipment::query()->whereIn('awb', $awbs)->get()->keyBy('awb');
        $results = [];
        foreach ($awbs as $awb) {
            if ($shipments->has($awb)) {
                $results[$awb] = $this->summary($shipments[$awb]);
            }
        }

        return response()->json(['shipments' => $results]);
    }

    public function tracking(string $awb): JsonResponse
    {
        $shipment = Shipment::query()->with(['courier', 'thermalAsset'])->where('awb', strtoupper($awb))->first();
        if (! $shipment) {
            return response()->json(['message' => 'Paket tidak ditemukan.'], 404);
        }
        $asset = $shipment->thermalAsset;
        $readings = $asset ? TemperatureReading::query()->where('thermal_asset_id', $asset->id) : null;
        $latest = $readings ? (clone $readings)->latest('observed_at')->first() : null;
        $stats = $readings ? (clone $readings)->selectRaw(
            'COUNT(*) AS count, MIN(temperature_c) AS minimum, MAX(temperature_c) AS maximum, AVG(temperature_c) AS average'
        )->first() : null;
        $count = (int) ($stats?->count ?? 0);
        $warning = $readings ? (clone $readings)->where('temperature_status', 'WARNING')->count() : 0;
        $critical = $readings ? (clone $readings)->where('temperature_status', 'CRITICAL')->count() : 0;
        $date = $shipment->updated_at->toIso8601String();
        $status = $this->statusLabel($shipment->status);

        return response()->json(['shipment' => [
            ...$this->summary($shipment),
            'origin' => $shipment->origin,
            'destination' => $shipment->destination,
            'events' => [[
                'id' => 'shipment-'.$shipment->id,
                'status' => $status,
                'title' => $status,
                'description' => 'Status pengiriman tercatat pada database lokal Day 13.',
                'occurredAt' => $date,
            ]],
            'route' => ['points' => [], 'completedIndex' => 0],
            'pickup' => null,
            'delivery' => null,
            'temperature' => [
                'asset' => $asset?->name ?? 'Aset belum ditentukan',
                'assetCode' => $asset?->code ?? '—',
                'valueC' => $latest ? (float) $latest->temperature_c : null,
                'observedAt' => $latest?->observed_at?->toIso8601String(),
                'state' => strtolower($latest?->temperature_status ?? 'pending'),
                'normalLowC' => (float) ($asset?->normal_low_c ?? -20),
                'normalHighC' => (float) ($asset?->normal_high_c ?? -18),
            ],
            'segments' => $asset ? [[
                'id' => $asset->id,
                'asset' => $asset->name,
                'description' => 'Aset termal pengiriman',
                'state' => $shipment->status === 'delivered' ? 'completed' : 'active',
                'valueC' => $latest ? (float) $latest->temperature_c : null,
            ]] : [],
            'temperatureAnalysis' => [
                'readingCount' => $count,
                'minimumC' => $count ? (float) $stats->minimum : null,
                'maximumC' => $count ? (float) $stats->maximum : null,
                'averageC' => $count ? round((float) $stats->average, 1) : null,
                'warningCount' => $warning,
                'criticalCount' => $critical,
            ],
        ]]);
    }

    public function readings(string $awb): JsonResponse
    {
        $shipment = Shipment::query()->with('thermalAsset')->where('awb', strtoupper($awb))->first();
        if (! $shipment) {
            return response()->json(['message' => 'Paket tidak ditemukan.'], 404);
        }
        $asset = $shipment->thermalAsset;
        $rows = $asset ? TemperatureReading::query()->where('thermal_asset_id', $asset->id)
            ->latest('observed_at')->limit(100)->get() : collect();

        return response()->json(['readings' => $rows->map(fn ($row) => [
            'id' => $row->id,
            'asset' => $asset->code,
            'valueC' => (float) $row->temperature_c,
            'observedAt' => $row->observed_at->toIso8601String(),
            'state' => strtolower($row->temperature_status),
        ])]);
    }

    private function summary(Shipment $shipment): array
    {
        return [
            'awb' => $shipment->awb,
            'stage' => strtoupper($shipment->status),
            'status' => $this->statusLabel($shipment->status),
            'latestDescription' => 'Pengiriman ditangani oleh '.$shipment->courier->name.'.',
            'sender' => $shipment->sender_name,
            'recipient' => $shipment->recipient_name,
            'lastEventAt' => $shipment->updated_at->toIso8601String(),
        ];
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'delivered' => 'Terkirim',
            'in_transit' => 'Dalam perjalanan',
            'out_for_delivery' => 'Sedang diantar',
            default => 'Menunggu pickup',
        };
    }

    private function rules(?Shipment $shipment = null): array
    {
        return [
            'awb' => ['required', 'regex:/^[A-Z0-9][A-Z0-9-]{5,49}$/', Rule::unique('shipments', 'awb')->ignore($shipment?->id)],
            'sender_name' => ['required', 'string', 'min:2', 'max:160'],
            'recipient_name' => ['required', 'string', 'min:2', 'max:160'],
            'origin' => ['required', 'string', 'max:180'],
            'destination' => ['required', 'string', 'max:180'],
            'weight_kg' => ['required', 'numeric', 'gt:0', 'lte:1000'],
            'status' => ['required', Rule::in(['pending', 'in_transit', 'out_for_delivery', 'delivered'])],
            'courier_id' => ['required', 'integer', 'exists:couriers,id'],
            'thermal_asset_id' => ['nullable', 'integer', 'exists:thermal_assets,id'],
        ];
    }
}
