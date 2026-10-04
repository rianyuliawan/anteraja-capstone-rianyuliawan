<?php

namespace Database\Seeders;

use Illuminate\Database\Connection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CapstoneDatasetSeeder extends Seeder
{
    private const DATASETS = [
        ['temperature_profiles', 'temperature_profiles.csv', 3],
        ['hubs', 'hubs.csv', 10],
        ['thermal_assets', 'thermal_assets.csv', 86],
        ['shipments', 'shipments.csv', 70],
        ['route_stops', 'route_stops.csv', 266],
        ['shipment_events', 'shipment_events.csv', 274],
        ['shipment_parties', 'shipment_parties.csv', 70],
        ['couriers', 'couriers.csv', 4],
        ['shipment_event_people', 'shipment_event_people.csv', 112],
        ['shipment_event_media', 'shipment_event_media.csv', 84],
        ['shipment_asset_assignments', 'shipment_asset_assignments.csv', 260],
        ['temperature_readings', 'temperature_readings_seed.csv', 400],
    ];

    public function run(): void
    {
        if (DB::getDefaultConnection() === 'sqlite') {
            return;
        }

        $dataset = DB::connection();
        if ($dataset->getDriverName() !== 'pgsql') {
            throw new RuntimeException('Dataset Anteraja Frozen memerlukan PostgreSQL.');
        }

        if ($dataset->selectOne("SELECT to_regclass('public.shipments') AS name")->name === null) {
            throw new RuntimeException('Jalankan php artisan migrate sebelum melakukan seed.');
        }

        if ($dataset->table('shipments')->exists()) {
            $this->command?->info('Data pengiriman sudah ada; seeder dilewati tanpa mengubah database.');

            return;
        }

        foreach (self::DATASETS as [$table]) {
            if ($dataset->table("seed.$table")->exists()) {
                throw new RuntimeException("seed.$table sudah terisi. Seed dibatalkan agar tidak mencampur data.");
            }
        }

        $root = base_path('../../../docs/database');
        $transform = @file_get_contents("$root/sql/anteraja_frozen_seed_transform.sql");
        if ($transform === false) {
            throw new RuntimeException('Berkas transformasi seed tidak ditemukan di docs/database/sql.');
        }

        $dataset->transaction(function () use ($dataset, $root, $transform): void {
            foreach (self::DATASETS as [$table, $filename, $expected]) {
                $this->loadCsv($dataset, "seed.$table", "$root/sample-data/$filename", $expected);
            }

            // Keep the existing normalization/validation SQL as the single source of truth.
            $sql = preg_replace('/^BEGIN;\s*$/m', '', $transform);
            $sql = preg_replace('/^COMMIT;\s*$/m', '', $sql);
            $dataset->unprepared($sql);

            if ($dataset->table('shipments')->count() !== 70 ||
                $dataset->table('shipment_events')->count() !== 274 ||
                $dataset->table('temperature_readings')->count() !== 400) {
                throw new RuntimeException('Jumlah baris hasil seed tidak sesuai; transaksi dibatalkan.');
            }
        });

        $this->command?->info('Dataset Anteraja Frozen berhasil diimpor dan dinormalisasi.');
    }

    private function loadCsv(Connection $dataset, string $table, string $path, int $expected): void
    {
        $file = @fopen($path, 'rb');
        if ($file === false) {
            throw new RuntimeException("CSV tidak ditemukan: $path");
        }

        try {
            $header = fgetcsv($file);
            if (! is_array($header) || $header === []) {
                throw new RuntimeException("Header CSV tidak valid: $path");
            }
            $header = array_map(
                static fn (string $name): string => $name === 'trigger' ? 'trigger_type' : $name,
                $header
            );

            $rows = [];
            $total = 0;
            while (($values = fgetcsv($file)) !== false) {
                if (count($values) !== count($header)) {
                    throw new RuntimeException('Jumlah kolom CSV tidak sesuai pada baris '.($total + 2).": $path");
                }
                $rows[] = array_combine(
                    $header,
                    array_map(static fn (string $value): ?string => $value === '' ? null : $value, $values)
                );
                $total++;
                if (count($rows) === 100) {
                    $dataset->table($table)->insert($rows);
                    $rows = [];
                }
            }
            if ($rows !== []) {
                $dataset->table($table)->insert($rows);
            }
            if ($total !== $expected) {
                throw new RuntimeException("Jumlah baris $path adalah $total, seharusnya $expected.");
            }
        } finally {
            fclose($file);
        }
    }
}
