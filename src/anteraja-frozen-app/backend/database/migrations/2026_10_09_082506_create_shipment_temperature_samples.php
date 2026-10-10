<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDefaultConnection() === 'sqlite') {
            return;
        }

        DB::connection()->transaction(function (): void {
            DB::statement(<<<'SQL'
                CREATE TABLE IF NOT EXISTS shipment_temperature_samples (
                    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                    shipment_id bigint NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
                    assignment_id bigint NOT NULL REFERENCES shipment_asset_assignments(id) ON DELETE CASCADE,
                    temperature_reading_id bigint NOT NULL,
                    observed_at timestamptz NOT NULL,
                    temperature_c numeric(5,2) NOT NULL,
                    temperature_status varchar(20),
                    source varchar(30) NOT NULL,
                    trigger_type varchar(20) NOT NULL,
                    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT shipment_temperature_samples_reading_uq
                        UNIQUE (shipment_id, temperature_reading_id)
                )
                SQL);
            DB::statement('CREATE INDEX IF NOT EXISTS shipment_temperature_samples_latest_idx ON shipment_temperature_samples (shipment_id, observed_at DESC, temperature_reading_id DESC)');
            DB::statement('CREATE INDEX IF NOT EXISTS shipment_temperature_samples_assignment_idx ON shipment_temperature_samples (assignment_id, observed_at DESC, temperature_reading_id DESC)');

            DB::statement(<<<'SQL'
                WITH by_assignment AS (
                    SELECT a.shipment_id, a.id AS assignment_id,
                           r.id AS temperature_reading_id, r.observed_at,
                           r.temperature_c, r.temperature_status, r.source, r.trigger_type,
                           row_number() OVER (
                               PARTITION BY a.shipment_id, a.id
                               ORDER BY r.observed_at DESC, r.id DESC
                           ) AS assignment_rank
                    FROM shipment_asset_assignments a
                    JOIN temperature_readings r
                      ON r.thermal_asset_id = a.thermal_asset_id
                     AND r.observed_at <@ a.active_period
                ), preferred AS (
                    SELECT *, row_number() OVER (
                        PARTITION BY shipment_id
                        ORDER BY CASE WHEN assignment_rank = 1 THEN 0 ELSE 1 END,
                                 observed_at DESC, temperature_reading_id DESC
                    ) AS shipment_rank
                    FROM by_assignment
                )
                INSERT INTO shipment_temperature_samples (
                    shipment_id, assignment_id, temperature_reading_id,
                    observed_at, temperature_c, temperature_status, source, trigger_type
                )
                SELECT shipment_id, assignment_id, temperature_reading_id,
                       observed_at, temperature_c, temperature_status, source, trigger_type
                FROM preferred WHERE shipment_rank <= 8
                ON CONFLICT (shipment_id, temperature_reading_id) DO NOTHING
                SQL);

            DB::statement(<<<'SQL'
                CREATE OR REPLACE VIEW shipment_temperature_history AS
                SELECT a.shipment_id, a.id AS assignment_id, a.segment,
                       a.thermal_asset_id, ta.asset_code, ta.asset_type,
                       sample.temperature_reading_id, sample.observed_at,
                       sample.temperature_c, sample.temperature_status,
                       sample.source, sample.trigger_type
                FROM shipment_temperature_samples sample
                JOIN shipment_asset_assignments a ON a.id = sample.assignment_id
                JOIN thermal_assets ta ON ta.id = a.thermal_asset_id
                SQL);

            DB::statement(<<<'SQL'
                WITH ranked AS (
                    SELECT id, row_number() OVER (
                        PARTITION BY thermal_asset_id ORDER BY observed_at DESC, id DESC
                    ) AS reading_rank
                    FROM temperature_readings
                )
                DELETE FROM temperature_readings r
                USING ranked
                WHERE r.id = ranked.id AND ranked.reading_rank > 8
                SQL);
        });
    }

    public function down(): void
    {
        throw new RuntimeException('Rollback riwayat suhu dinonaktifkan agar data tidak terhapus.');
    }
};
