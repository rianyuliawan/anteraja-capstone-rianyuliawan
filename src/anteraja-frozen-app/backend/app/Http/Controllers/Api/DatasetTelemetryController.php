<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dataset\ThermalAsset;
use App\Services\DatasetTemperatureService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DatasetTelemetryController extends Controller
{
    public function assets(Request $request): JsonResponse
    {
        if (! $this->authorized($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $assets = ThermalAsset::query()->with('profile')
            ->where('is_active', true)->orderBy('asset_code')->get()
            ->map(fn ($asset) => [
                'asset_code' => $asset->asset_code,
                'asset_type' => $asset->asset_type,
                // All assets read hourly, but each has a stable minute slot.
                'schedule_minute' => (int) $asset->reading_minute,
                'target_c' => (float) $asset->profile->target_c,
                'normal_low_c' => (float) $asset->profile->normal_low_c,
                'normal_high_c' => (float) $asset->profile->normal_high_c,
                'warning_low_c' => (float) $asset->profile->warning_low_c,
                'warning_high_c' => (float) $asset->profile->warning_high_c,
            ]);

        return response()->json(['assets' => $assets]);
    }

    public function store(Request $request, DatasetTemperatureService $temperature): JsonResponse
    {
        if (! $this->authorized($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $input = $request->all();
        $payload = array_key_exists('readings', $input) ? $input : ['readings' => [$input]];
        $validated = Validator::make($payload, [
            'readings' => ['required', 'array', 'min:1', 'max:100'],
            'readings.*.message_id' => ['required', 'string', 'regex:/^[A-Za-z0-9._:-]{1,120}$/'],
            'readings.*.asset_code' => ['required', 'string', 'regex:/^[A-Z0-9][A-Z0-9-]{1,49}$/'],
            'readings.*.observed_at' => ['required', 'date'],
            'readings.*.temperature_c' => ['required', 'numeric', 'between:-100,100'],
        ])->validate();

        $result = $temperature->save($validated['readings']);

        return response()->json($result, $result['inserted'] > 0 ? 201 : 200);
    }

    private function authorized(Request $request): bool
    {
        $token = (string) config('services.anteraja_ingest_token');

        return $token !== '' && hash_equals($token, (string) $request->bearerToken());
    }
}
