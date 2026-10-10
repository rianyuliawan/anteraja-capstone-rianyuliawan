<?php

namespace Database\Seeders;

use App\Services\DemoTemperatureHistoryService;
use Illuminate\Database\Connection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CapstoneDatasetSeeder extends Seeder
{
    private const DATASETS = [
        ['temperature_profiles', 'temperature_profiles.csv', 4],
        ['hubs', 'hubs.csv', 10],
        ['staging_stores', 'staging_stores.csv', 10],
        ['thermal_assets', 'thermal_assets.csv', 96],
        ['shipments', 'shipments.csv', 70],
        ['route_stops', 'route_stops.csv', 336],
        ['shipment_events', 'shipment_events.csv', 316],
        ['shipment_parties', 'shipment_parties.csv', 70],
        ['couriers', 'couriers.csv', 4],
        ['shipment_event_people', 'shipment_event_people.csv', 112],
        ['shipment_event_media', 'shipment_event_media.csv', 84],
        ['shipment_asset_assignments', 'shipment_asset_assignments.csv', 302],
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

        $root = database_path('dataset');
        $transform = @file_get_contents("$root/anteraja_frozen_seed_transform.sql");
        if ($transform === false) {
            throw new RuntimeException('Berkas transformasi seed tidak ditemukan di backend/database/dataset.');
        }

        $dataset->transaction(function () use ($dataset, $root, $transform): void {
            foreach (self::DATASETS as [$table, $filename, $expected]) {
                $this->loadCsv($dataset, "seed.$table", "$root/$filename", $expected);
            }

            // Keep the existing normalization/validation SQL as the single source of truth.
            $sql = preg_replace('/^BEGIN;\s*$/m', '', $transform);
            $sql = preg_replace('/^COMMIT;\s*$/m', '', $sql);
            $dataset->unprepared($sql);
            $dataset->statement('UPDATE thermal_assets SET reading_minute = (id * 17) % 60');

            // The source CSV no longer supplies per-package temperature rows.
            // Generate the readings from each asset's own hourly clock instead.
            app(DemoTemperatureHistoryService::class)->rebuild();

            $tooManySamples = $dataset->selectOne("
                SELECT EXISTS (
                    SELECT 1 FROM shipment_temperature_samples sample
                    WHERE NOT EXISTS (
                        SELECT 1 FROM shipment_events event
                        WHERE event.shipment_id = sample.shipment_id
                          AND event.event_code = 'DELIVERED'
                    )
                    GROUP BY sample.shipment_id HAVING count(*) > 8
                ) AS found
            ")->found;
            $tooManyRawReadings = $dataset->selectOne('
                SELECT EXISTS (
                    SELECT 1 FROM temperature_readings
                    GROUP BY thermal_asset_id HAVING count(*) > 8
                ) AS found
            ')->found;
            $invalidHourlySchedule = $dataset->selectOne(<<<'SQL'
                SELECT EXISTS (
                    SELECT 1 FROM temperature_readings r
                    JOIN thermal_assets asset ON asset.id = r.thermal_asset_id
                    WHERE r.source = 'SEED'
                      AND extract(minute FROM r.observed_at AT TIME ZONE 'UTC')::int
                          <> asset.reading_minute
                ) OR EXISTS (
                    SELECT 1 FROM temperature_readings
                    WHERE source = 'SEED'
                    GROUP BY thermal_asset_id, date_trunc('hour', observed_at)
                    HAVING count(*) > 1
                ) AS found
                SQL)->found;
            $shipmentsWithoutTemperature = $dataset->selectOne(<<<'SQL'
                SELECT EXISTS (
                    SELECT 1 FROM shipments shipment
                    WHERE NOT EXISTS (
                        SELECT 1 FROM shipment_temperature_samples sample
                        WHERE sample.shipment_id = shipment.id AND sample.source = 'SEED'
                    )
                ) AS found
                SQL)->found;

            if ($dataset->table('shipments')->count() !== 70 ||
                $dataset->table('thermal_assets')->count() !== 96 ||
                $dataset->table('shipment_events')->count() !== 316 ||
                $dataset->table('shipment_temperature_samples')->count() === 0 ||
                $tooManySamples || $tooManyRawReadings ||
                $invalidHourlySchedule || $shipmentsWithoutTemperature) {
                throw new RuntimeException('Jumlah baris atau batas riwayat hasil seed tidak sesuai; transaksi dibatalkan.');
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
            $header = fgetcsv($file, 0, ',', '"', '');
            if (! is_array($header) || $header === []) {
                throw new RuntimeException("Header CSV tidak valid: $path");
            }
            $header = array_map(
                static fn (string $name): string => $name === 'trigger' ? 'trigger_type' : $name,
                $header
            );

            $rows = [];
            $total = 0;
            while (($values = fgetcsv($file, 0, ',', '"', '')) !== false) {
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
