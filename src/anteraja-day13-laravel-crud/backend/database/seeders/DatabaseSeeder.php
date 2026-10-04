<?php

namespace Database\Seeders;

use App\Models\Courier;
use App\Models\Shipment;
use App\Models\ThermalAsset;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['code' => 'CR-001', 'name' => 'Satria', 'rating' => 4.8],
            ['code' => 'CR-002', 'name' => 'Rina', 'rating' => 4.7],
            ['code' => 'CR-003', 'name' => 'Dimas', 'rating' => 4.9],
            ['code' => 'CR-004', 'name' => 'Nadia', 'rating' => 4.6],
        ] as $row) {
            Courier::updateOrCreate(['code' => $row['code']], [...$row, 'is_active' => true]);
        }

        foreach ([
            ['code' => 'BAG-002', 'name' => 'Cooler Bag 002', 'type' => 'COOLER_BAG'],
            ['code' => 'BAG-005', 'name' => 'Cooler Bag 005', 'type' => 'COOLER_BAG'],
            ['code' => 'BAG-012', 'name' => 'Cooler Bag 012', 'type' => 'COOLER_BAG'],
            ['code' => 'BOX-02', 'name' => 'Mobil Boks 02', 'type' => 'MOBIL_BOX'],
            ['code' => 'BOX-06', 'name' => 'Mobil Boks 06', 'type' => 'MOBIL_BOX'],
            ['code' => 'FREEZER-JKT-UTR', 'name' => 'Hub Freezer Jakarta Utara', 'type' => 'HUB_FREEZER'],
            ['code' => 'FREEZER-JKT-PST', 'name' => 'Hub Freezer Jakarta Pusat', 'type' => 'HUB_FREEZER'],
        ] as $row) {
            ThermalAsset::updateOrCreate(['code' => $row['code']], [
                ...$row,
                'target_c' => -19,
                'normal_low_c' => -20,
                'normal_high_c' => -18,
                'warning_low_c' => -22,
                'warning_high_c' => -16,
                'is_active' => true,
            ]);
        }

        $statuses = ['pending', 'in_transit', 'out_for_delivery', 'delivered'];
        $assets = ThermalAsset::query()->orderBy('id')->pluck('id')->all();
        $courierIds = Courier::query()->orderBy('id')->pluck('id')->all();
        for ($number = 1; $number <= 12; $number++) {
            Shipment::updateOrCreate(['awb' => sprintf('ANT-FRZ-%04d', $number)], [
                'sender_name' => 'Pengirim Contoh '.$number,
                'recipient_name' => 'Penerima Contoh '.$number,
                'origin' => 'Jakarta Pusat',
                'destination' => $number % 2 ? 'Jakarta Selatan' : 'Bandung',
                'weight_kg' => 1 + $number * 0.25,
                'status' => $statuses[($number - 1) % 4],
                'courier_id' => $courierIds[($number - 1) % count($courierIds)],
                'thermal_asset_id' => $assets[($number - 1) % count($assets)],
            ]);
        }
    }
}
