<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE thermal_assets ADD COLUMN reading_minute smallint NOT NULL DEFAULT 0');
        DB::statement('UPDATE thermal_assets SET reading_minute = (id * 17) % 60');
        DB::statement('ALTER TABLE thermal_assets ADD CONSTRAINT thermal_assets_reading_minute_chk CHECK (reading_minute BETWEEN 0 AND 59)');

        DB::statement('ALTER TABLE shipment_temperature_samples ADD COLUMN associated_at timestamptz');
        DB::statement("ALTER TABLE shipment_temperature_samples ADD COLUMN association_kind varchar(20) NOT NULL DEFAULT 'SCHEDULED'");
        DB::statement('UPDATE shipment_temperature_samples SET associated_at = observed_at');
        DB::statement('ALTER TABLE shipment_temperature_samples ALTER COLUMN associated_at SET NOT NULL');
        DB::statement('ALTER TABLE shipment_temperature_samples DROP CONSTRAINT shipment_temperature_samples_reading_uq');
        DB::statement('ALTER TABLE shipment_temperature_samples ADD CONSTRAINT shipment_temperature_samples_assignment_reading_uq UNIQUE (assignment_id, temperature_reading_id)');
        DB::statement("ALTER TABLE shipment_temperature_samples ADD CONSTRAINT shipment_temperature_samples_kind_chk CHECK (association_kind IN ('SCHEDULED', 'HANDOFF'))");
        DB::statement('CREATE INDEX shipment_temperature_samples_associated_idx ON shipment_temperature_samples (shipment_id, associated_at DESC, id DESC)');

        DB::statement(<<<'SQL'
            CREATE OR REPLACE VIEW shipment_temperature_history AS
            SELECT a.shipment_id, a.id AS assignment_id, a.segment,
                   a.thermal_asset_id, ta.asset_code, ta.asset_type,
                   sample.temperature_reading_id, sample.observed_at,
                   sample.temperature_c, sample.temperature_status,
                   sample.source, sample.trigger_type,
                   sample.associated_at, sample.association_kind,
                   sample.id AS sample_id
            FROM shipment_temperature_samples sample
            JOIN shipment_asset_assignments a ON a.id = sample.assignment_id
            JOIN thermal_assets ta ON ta.id = a.thermal_asset_id
            SQL);
        DB::statement(<<<'SQL'
            CREATE OR REPLACE VIEW shipment_latest_temperature AS
            SELECT DISTINCT ON (h.shipment_id)
                   h.shipment_id, h.assignment_id, h.segment, h.thermal_asset_id,
                   h.asset_code, h.asset_type, h.temperature_reading_id,
                   h.observed_at, h.temperature_c, h.temperature_status,
                   h.source, h.trigger_type
            FROM shipment_temperature_history h
            ORDER BY h.shipment_id, h.associated_at DESC, h.sample_id DESC
            SQL);
        DB::statement("COMMENT ON VIEW shipment_temperature_history IS 'Asset readings associated with a shipment, including the latest asset reading at each handoff; observed_at and associated_at are distinct.'");
    }

    public function down(): void
    {
        throw new RuntimeException('Rollback riwayat suhu dinonaktifkan agar data pembacaan tidak terhapus.');
    }
};
