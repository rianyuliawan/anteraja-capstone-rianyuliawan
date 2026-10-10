<?php

use App\Http\Controllers\Api\CapstoneMediaController;
use App\Http\Controllers\Api\CapstoneTrackingController;
use App\Http\Controllers\Api\DatasetTelemetryController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));
Route::get('/shipments', [CapstoneTrackingController::class, 'search'])
    ->middleware('throttle:tracking-search');

Route::middleware('throttle:tracking-detail')->group(function (): void {
    Route::get('/shipments/{awb}/temperature-readings', [CapstoneTrackingController::class, 'readings']);
    Route::get('/shipments/{awb}/media/{mediaId}', [CapstoneMediaController::class, 'show']);
    Route::get('/shipments/{awb}', [CapstoneTrackingController::class, 'show']);
});

Route::get('/internal/thermal-assets', [DatasetTelemetryController::class, 'assets']);
Route::post('/internal/temperature-readings', [DatasetTelemetryController::class, 'store']);
