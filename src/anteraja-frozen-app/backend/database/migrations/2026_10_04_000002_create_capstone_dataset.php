<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite tests do not contain the PostgreSQL-specific tracking schema.
        if (DB::getDefaultConnection() === 'sqlite') {
            return;
        }

        $dataset = DB::connection();
        if ($dataset->getDriverName() !== 'pgsql') {
            throw new RuntimeException('Dataset capstone memerlukan PostgreSQL.');
        }

        $existing = $dataset->selectOne("SELECT to_regclass('public.shipments') AS name");
        if ($existing->name !== null) {
            $required = ['shipment_events', 'thermal_assets', 'temperature_readings'];
            foreach ($required as $table) {
                if ($dataset->selectOne('SELECT to_regclass(?) AS name', ["public.$table"])->name === null) {
                    throw new RuntimeException("Database dataset belum lengkap: $table tidak ada.");
                }
            }

            return;
        }

        $path = base_path('../../../docs/database/sql/anteraja_frozen_schema.sql');
        $sql = file_get_contents($path);
        if ($sql === false) {
            throw new RuntimeException("Skema dataset tidak ditemukan: $path");
        }

        $sql = preg_replace('/^BEGIN;\s*$/m', '', $sql);
        $sql = preg_replace('/^COMMIT;\s*$/m', '', $sql);
        $dataset->transaction(fn () => $dataset->unprepared($sql));
    }

    public function down(): void
    {
        throw new RuntimeException('Rollback dataset capstone dinonaktifkan agar data tidak terhapus.');
    }
};
