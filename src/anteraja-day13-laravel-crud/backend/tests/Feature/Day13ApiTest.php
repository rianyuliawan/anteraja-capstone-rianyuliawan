<?php

namespace Tests\Feature;

use App\Models\ThermalAsset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Day13ApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_courier_and_shipment_crud_with_eloquent_relation(): void
    {
        $courier = $this->postJson('/api/couriers', [
            'code' => 'CR-TEST', 'name' => 'Kurir Uji', 'rating' => 4.7, 'is_active' => true,
        ])->assertCreated()->json('courier');

        $asset = ThermalAsset::create([
            'code' => 'BOX-TEST', 'name' => 'Boks Uji', 'type' => 'MOBIL_BOX',
            'target_c' => -19, 'normal_low_c' => -20, 'normal_high_c' => -18,
            'warning_low_c' => -22, 'warning_high_c' => -16, 'is_active' => true,
        ]);

        $payload = [
            'awb' => 'ANT-FRZ-TEST', 'sender_name' => 'Rian',
            'recipient_name' => 'Dewi', 'origin' => 'Jakarta',
            'destination' => 'Bandung', 'weight_kg' => 2.5,
            'status' => 'pending', 'courier_id' => $courier['id'],
            'thermal_asset_id' => $asset->id,
        ];
        $shipment = $this->postJson('/api/admin/shipments', $payload)
            ->assertCreated()->assertJsonPath('shipment.courier.name', 'Kurir Uji')
            ->json('shipment');

        $this->getJson('/api/admin/shipments/'.$shipment['id'])
            ->assertOk()->assertJsonPath('shipment.awb', 'ANT-FRZ-TEST');
        $this->getJson('/api/shipments?awbs=ANT-FRZ-TEST,UNKNOWN-0001')
            ->assertOk()->assertJsonCount(1, 'shipments');
        $this->putJson('/api/admin/shipments/'.$shipment['id'], [...$payload, 'status' => 'delivered'])
            ->assertOk()->assertJsonPath('shipment.status', 'delivered');
        $this->getJson('/api/shipments/ANT-FRZ-TEST')
            ->assertOk()->assertJsonPath('shipment.stage', 'DELIVERED');

        $this->deleteJson('/api/couriers/'.$courier['id'])->assertStatus(409);
        $this->deleteJson('/api/admin/shipments/'.$shipment['id'])->assertNoContent();
        $this->deleteJson('/api/couriers/'.$courier['id'])->assertNoContent();
        $this->assertDatabaseMissing('shipments', ['awb' => 'ANT-FRZ-TEST']);
    }

    public function test_validation_and_node_red_ingest(): void
    {
        $this->postJson('/api/admin/shipments', ['awb' => 'BAD'])
            ->assertUnprocessable()->assertJsonValidationErrors(['awb', 'courier_id']);
        $asset = ThermalAsset::create([
            'code' => 'BOX-TEST', 'name' => 'Boks Uji', 'type' => 'MOBIL_BOX',
            'target_c' => -19, 'normal_low_c' => -20, 'normal_high_c' => -18,
            'warning_low_c' => -22, 'warning_high_c' => -16, 'is_active' => true,
        ]);
        config(['services.anteraja_ingest_token' => 'test-token']);
        $this->getJson('/api/internal/thermal-assets')->assertUnauthorized();
        $this->getJson('/api/internal/thermal-assets', ['Authorization' => 'Bearer test-token'])
            ->assertOk()->assertJsonPath('assets.0.asset_code', $asset->code);

        $reading = [
            'readings' => [[
                'message_id' => 'day13-test-1', 'asset_code' => 'BOX-TEST',
                'observed_at' => now()->toIso8601String(), 'temperature_c' => -17.2,
            ]],
        ];
        $headers = ['Authorization' => 'Bearer test-token'];
        $this->postJson('/api/internal/temperature-readings', $reading, $headers)
            ->assertCreated()->assertJsonPath('inserted', 1);
        $this->postJson('/api/internal/temperature-readings', $reading, $headers)
            ->assertOk()->assertJsonPath('duplicates', 1);
        $this->assertDatabaseCount('temperature_readings', 1);
        $this->assertDatabaseHas('temperature_readings', ['temperature_status' => 'WARNING']);
    }
}
