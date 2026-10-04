<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TemperatureReading;
use App\Models\ThermalAsset;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TelemetryController extends Controller
{
    public function assets(Request $request): JsonResponse
    {
        if (! $this->authorized($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json(['assets' => ThermalAsset::query()->where('is_active', true)
            ->orderBy('code')->get()->map(fn ($asset) => [
                'asset_code' => $asset->code,
                'asset_type' => $asset->type,
                'target_c' => (float) $asset->target_c,
                'normal_low_c' => (float) $asset->normal_low_c,
                'normal_high_c' => (float) $asset->normal_high_c,
                'warning_low_c' => (float) $asset->warning_low_c,
                'warning_high_c' => (float) $asset->warning_high_c,
            ])]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->authorized($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        $payload = $request->has('readings') ? $request->all() : ['readings' => [$request->all()]];
        $data = Validator::make($payload, [
            'readings' => ['required', 'array', 'min:1', 'max:100'],
            'readings.*.message_id' => ['required', 'string', 'regex:/^[A-Za-z0-9._:-]{1,120}$/'],
            'readings.*.asset_code' => ['required', 'string', 'max:50'],
            'readings.*.observed_at' => ['required', 'date'],
            'readings.*.temperature_c' => ['required', 'numeric', 'between:-100,100'],
        ])->validate();
        $assets = ThermalAsset::query()->where('is_active', true)
            ->whereIn('code', array_column($data['readings'], 'asset_code'))->get()->keyBy('code');
        $prepared = [];
        foreach ($data['readings'] as $reading) {
            $asset = $assets->get($reading['asset_code']);
            if (! $asset) {
                return response()->json(['message' => 'Aset tidak dikenal atau tidak aktif.'], 422);
            }
            $time = CarbonImmutable::parse($reading['observed_at']);
            if ($time->greaterThan(now()->addMinutes(5)) || $time->lessThan(now()->subDays(7))) {
                return response()->json(['message' => 'Waktu pembacaan di luar batas 7 hari.'], 422);
            }
            $value = round((float) $reading['temperature_c'], 2);
            $status = $value >= $asset->normal_low_c && $value <= $asset->normal_high_c
                ? 'NORMAL'
                : ($value >= $asset->warning_low_c && $value <= $asset->warning_high_c ? 'WARNING' : 'CRITICAL');
            $prepared[] = [
                'thermal_asset_id' => $asset->id,
                'source' => 'NODE_RED',
                'message_id' => $reading['message_id'],
                'temperature_c' => $value,
                'temperature_status' => $status,
                'observed_at' => $time->utc(),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        $inserted = DB::transaction(function () use ($prepared): int {
            $count = 0;
            foreach ($prepared as $row) {
                $existing = TemperatureReading::query()->where('source', $row['source'])
                    ->where('message_id', $row['message_id'])->first();
                if ($existing) {
                    if ($existing->thermal_asset_id !== $row['thermal_asset_id'] ||
                        (float) $existing->temperature_c !== $row['temperature_c'] ||
                        ! $existing->observed_at->equalTo($row['observed_at'])) {
                        abort(422, 'message_id sudah digunakan untuk pembacaan lain.');
                    }

                    continue;
                }
                TemperatureReading::create($row);
                $count++;
            }

            return $count;
        });

        return response()->json(['inserted' => $inserted, 'duplicates' => count($prepared) - $inserted], $inserted ? 201 : 200);
    }

    private function authorized(Request $request): bool
    {
        $token = (string) config('services.anteraja_ingest_token');

        return $token !== '' && hash_equals($token, (string) $request->bearerToken());
    }
}
