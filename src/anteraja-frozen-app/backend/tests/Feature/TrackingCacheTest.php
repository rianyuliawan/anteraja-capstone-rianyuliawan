<?php

namespace Tests\Feature;

use App\Services\CapstoneTrackingService;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class TrackingCacheTest extends TestCase
{
    public function test_detail_and_readings_are_served_from_cache(): void
    {
        $awb = 'ANT-FRZ-9001';
        Cache::put(CapstoneTrackingService::detailCacheKey($awb), [
            'awb' => $awb,
            'stage' => 'DELIVERED',
        ], 60);
        Cache::put(CapstoneTrackingService::readingsCacheKey($awb), [
            'readings' => [['id' => 'reading-1', 'valueC' => -5.2]],
        ], 60);

        $this->getJson("/api/shipments/$awb")
            ->assertOk()
            ->assertJsonPath('shipment.stage', 'DELIVERED');

        $this->getJson("/api/shipments/$awb/temperature-readings")
            ->assertOk()
            ->assertJsonPath('readings.0.valueC', -5.2);
    }

    public function test_search_uses_cached_batch_without_querying_database(): void
    {
        $awbs = ['ANT-FRZ-9002', 'ANT-FRZ-9003'];
        $key = 'tracking:v1:search:'.hash('sha256', implode(',', $awbs));
        Cache::put($key, [$awbs[0] => ['awb' => $awbs[0]]], 60);

        $this->getJson('/api/shipments?awbs='.implode(',', array_reverse($awbs)))
            ->assertOk()
            ->assertJsonCount(1, 'shipments')
            ->assertJsonPath("shipments.$awbs[0].awb", $awbs[0]);
    }

    public function test_cache_invalidation_only_forgets_the_affected_shipment(): void
    {
        $affected = 'ANT-FRZ-9004';
        $other = 'ANT-FRZ-9005';
        foreach ([$affected, $other] as $awb) {
            Cache::put(CapstoneTrackingService::detailCacheKey($awb), ['awb' => $awb], 60);
            Cache::put(CapstoneTrackingService::readingsCacheKey($awb), ['readings' => []], 60);
        }

        CapstoneTrackingService::forgetCachedShipment($affected);

        $this->assertNull(Cache::get(CapstoneTrackingService::detailCacheKey($affected)));
        $this->assertNull(Cache::get(CapstoneTrackingService::readingsCacheKey($affected)));
        $this->assertNotNull(Cache::get(CapstoneTrackingService::detailCacheKey($other)));
        $this->assertNotNull(Cache::get(CapstoneTrackingService::readingsCacheKey($other)));
    }
}
