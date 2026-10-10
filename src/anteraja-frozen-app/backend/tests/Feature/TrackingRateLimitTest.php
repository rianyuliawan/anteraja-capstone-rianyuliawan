<?php

namespace Tests\Feature;

use App\Services\CapstoneTrackingService;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class TrackingRateLimitTest extends TestCase
{
    public function test_search_is_limited_per_ip_without_blocking_another_visitor(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10']);

        for ($request = 0; $request < 30; $request++) {
            $this->getJson('/api/shipments')->assertOk();
        }

        $this->getJson('/api/shipments')->assertStatus(429);

        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.11']);
        $this->getJson('/api/shipments')->assertOk();
    }

    public function test_detail_and_readings_share_a_limit_but_internal_routes_do_not(): void
    {
        $awb = 'ANT-FRZ-9001';
        Cache::put(CapstoneTrackingService::detailCacheKey($awb), ['awb' => $awb], 60);
        Cache::put(CapstoneTrackingService::readingsCacheKey($awb), ['readings' => []], 60);
        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.12']);

        for ($request = 0; $request < 59; $request++) {
            $this->getJson("/api/shipments/$awb")->assertOk();
        }

        $this->getJson("/api/shipments/$awb/temperature-readings")->assertOk();
        $this->getJson("/api/shipments/$awb")->assertStatus(429);
        $this->getJson("/api/shipments/$awb/temperature-readings")->assertStatus(429);
        $this->getJson("/api/shipments/$awb/media/1")->assertStatus(429);

        $this->getJson('/api/internal/thermal-assets')->assertUnauthorized();
        $this->getJson('/api/health')->assertOk();
    }
}
