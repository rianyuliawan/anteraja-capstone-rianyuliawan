<?php

use App\Http\Controllers\Api\CourierController;
use App\Http\Controllers\Api\ShipmentController;
use App\Http\Controllers\Api\TelemetryController;
use App\Models\ThermalAsset;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));
Route::get('/assets', fn () => response()->json(['assets' => ThermalAsset::query()
    ->where('is_active', true)->orderBy('code')->get(['id', 'code', 'name'])]));

// CRUD lokal untuk latihan Day 13. Jangan publikasikan tanpa autentikasi.
Route::apiResource('couriers', CourierController::class);
Route::apiResource('admin/shipments', ShipmentController::class);

Route::get('/shipments', [ShipmentController::class, 'search']);
Route::get('/shipments/{awb}/temperature-readings', [ShipmentController::class, 'readings']);
Route::get('/shipments/{awb}', [ShipmentController::class, 'tracking']);

Route::get('/internal/thermal-assets', [TelemetryController::class, 'assets']);
Route::post('/internal/temperature-readings', [TelemetryController::class, 'store']);
