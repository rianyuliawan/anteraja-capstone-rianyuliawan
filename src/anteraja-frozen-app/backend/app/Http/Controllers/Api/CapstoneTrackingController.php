<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CapstoneTrackingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CapstoneTrackingController extends Controller
{
    public function search(Request $request, CapstoneTrackingService $tracking): JsonResponse
    {
        $raw = $request->query('awbs', '');
        if (! is_string($raw)) {
            return response()->json(['message' => 'Parameter AWB harus berupa teks.'], 422);
        }

        $awbs = array_values(array_unique(array_filter(array_map(
            static fn (string $awb): string => strtoupper(trim($awb)),
            explode(',', $raw)
        ))));
        if (count($awbs) > 10) {
            return response()->json(['message' => 'Maksimal 10 nomor resi.'], 422);
        }
        foreach ($awbs as $awb) {
            if (! preg_match('/^[A-Z0-9][A-Z0-9-]{5,49}$/', $awb)) {
                return response()->json(['message' => 'Format nomor resi tidak valid.'], 422);
            }
        }

        return response()->json(['shipments' => $tracking->search($awbs)]);
    }

    public function show(string $awb, CapstoneTrackingService $tracking): JsonResponse
    {
        $shipment = $tracking->find(strtoupper($awb));

        return $shipment === null
            ? response()->json(['message' => 'Paket tidak ditemukan.'], 404)
            : response()->json(['shipment' => $shipment]);
    }

    public function readings(string $awb, CapstoneTrackingService $tracking): JsonResponse
    {
        $result = $tracking->temperatureReadings(strtoupper($awb));

        return $result === null
            ? response()->json(['message' => 'Paket tidak ditemukan.'], 404)
            : response()->json($result);
    }
}
