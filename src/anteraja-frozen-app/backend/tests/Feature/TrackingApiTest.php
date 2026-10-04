<?php

namespace Tests\Feature;

use Tests\TestCase;

class TrackingApiTest extends TestCase
{
    public function test_empty_search_returns_no_shipments(): void
    {
        $this->getJson('/api/shipments')->assertOk()->assertExactJson(['shipments' => []]);
    }

    public function test_search_rejects_more_than_ten_resi(): void
    {
        $awbs = array_map(static fn (int $number): string => sprintf('ANT-FRZ-%04d', $number), range(1, 11));

        $this->getJson('/api/shipments?awbs='.implode(',', $awbs))->assertUnprocessable();
    }

    public function test_internal_assets_require_a_token(): void
    {
        $this->getJson('/api/internal/thermal-assets')->assertUnauthorized();
    }
}
