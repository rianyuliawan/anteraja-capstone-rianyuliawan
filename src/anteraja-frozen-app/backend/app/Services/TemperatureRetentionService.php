<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class TemperatureRetentionService
{
    public function lockActiveShipments(array $assetIds): void
    {
        DB::table('thermal_assets')->whereIn('id', $assetIds)
            ->orderBy('id')->lockForUpdate()->get(['id']);

        $shipmentIds = DB::table('shipment_asset_assignments')
            ->whereIn('thermal_asset_id', $assetIds)
            ->whereNull('ended_at')
            ->distinct()->orderBy('shipment_id')->pluck('shipment_id')->all();

        if ($shipmentIds !== []) {
            DB::table('shipments')->whereIn('id', $shipmentIds)
                ->orderBy('id')->lockForUpdate()->get(['id']);
        }
    }

    public function recordAndPrune(array $readingIds, array $assetIds): array
    {
        if ($readingIds === []) {
            return [];
        }

        $readingSlots = implode(',', array_fill(0, count($readingIds), '?'));
        DB::statement(<<<SQL
            INSERT INTO shipment_temperature_samples (
                shipment_id, assignment_id, temperature_reading_id,
                observed_at, temperature_c, temperature_status, source, trigger_type
            )
            SELECT a.shipment_id, a.id, r.id,
                   r.observed_at, r.temperature_c, r.temperature_status,
                   r.source, r.trigger_type
            FROM temperature_readings r
            JOIN shipment_asset_assignments a
              ON a.thermal_asset_id = r.thermal_asset_id
             AND a.ended_at IS NULL
             AND r.observed_at >= a.started_at
            WHERE r.id IN ($readingSlots)
            ON CONFLICT (shipment_id, temperature_reading_id) DO NOTHING
            SQL, $readingIds);

        $shipments = DB::table('shipment_temperature_samples as sample')
            ->join('shipments as shipment', 'shipment.id', '=', 'sample.shipment_id')
            ->whereIn('sample.temperature_reading_id', $readingIds)
            ->distinct()->get(['shipment.id', 'shipment.awb']);

        $shipmentIds = $shipments->pluck('id')->all();
        if ($shipmentIds !== []) {
            $shipmentSlots = implode(',', array_fill(0, count($shipmentIds), '?'));
            DB::statement(<<<SQL
                WITH by_assignment AS (
                    SELECT id, shipment_id, observed_at, temperature_reading_id,
                           row_number() OVER (
                               PARTITION BY shipment_id, assignment_id
                               ORDER BY observed_at DESC, temperature_reading_id DESC
                           ) AS assignment_rank
                    FROM shipment_temperature_samples
                    WHERE shipment_id IN ($shipmentSlots)
                ), preferred AS (
                    SELECT id, row_number() OVER (
                        PARTITION BY shipment_id
                        ORDER BY CASE WHEN assignment_rank = 1 THEN 0 ELSE 1 END,
                                 observed_at DESC, temperature_reading_id DESC
                    ) AS shipment_rank
                    FROM by_assignment
                )
                DELETE FROM shipment_temperature_samples sample
                USING preferred
                WHERE sample.id = preferred.id AND preferred.shipment_rank > 8
                SQL, $shipmentIds);
        }

        $assetSlots = implode(',', array_fill(0, count($assetIds), '?'));
        DB::statement(<<<SQL
            WITH ranked AS (
                SELECT id, row_number() OVER (
                    PARTITION BY thermal_asset_id ORDER BY observed_at DESC, id DESC
                ) AS reading_rank
                FROM temperature_readings
                WHERE thermal_asset_id IN ($assetSlots)
            )
            DELETE FROM temperature_readings reading
            USING ranked
            WHERE reading.id = ranked.id AND ranked.reading_rank > 8
            SQL, $assetIds);

        return $shipments->pluck('awb')->all();
    }
}
