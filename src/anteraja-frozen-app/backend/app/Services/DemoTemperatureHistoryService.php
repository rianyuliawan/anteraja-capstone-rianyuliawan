<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/** Build one deterministic hourly demo reading per asset, shared by its shipments. */
class DemoTemperatureHistoryService
{
    public function rebuild(): array
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return ['shipments' => 0, 'samples' => 0];
        }

        $awbs = DB::table('shipments')->pluck('awb')->all();

        if ($awbs === []) {
            return ['shipments' => 0, 'samples' => 0];
        }

        DB::transaction(function (): void {
            // The old seed made two readings for every assignment. That creates
            // several readings in one hour when many packages share an asset.
            // Replace only demo data; live NODE_RED/IOT data is never removed.
            DB::table('shipment_temperature_samples')->where('source', 'SEED')->delete();
            DB::table('temperature_readings')->where('source', 'SEED')->delete();

            // Active demo journeys have no end time. A bounded two-hour window
            // gives them useful hourly history without fabricating weeks of data.
            // The asset minute offset is stable, so packages on the same asset
            // always reuse the same sensor reading.
            DB::statement(<<<'SQL'
                WITH delivery AS (
                    SELECT shipment_id, max(occurred_at) AS delivered_at
                    FROM shipment_events WHERE event_code = 'DELIVERED'
                    GROUP BY shipment_id
                ), assignment_window AS (
                    SELECT a.thermal_asset_id, a.started_at,
                           CASE WHEN d.delivered_at IS NOT NULL
                                THEN least(coalesce(a.ended_at, d.delivered_at), d.delivered_at)
                                ELSE coalesce(a.ended_at, a.started_at + interval '2 hours')
                           END AS last_at
                    FROM shipment_asset_assignments a
                    LEFT JOIN delivery d ON d.shipment_id = a.shipment_id
                ), asset_window AS (
                    SELECT a.thermal_asset_id,
                           min(a.started_at) AS first_at,
                           max(a.last_at) AS last_at
                    FROM assignment_window a
                    GROUP BY a.thermal_asset_id
                ), hours AS (
                    SELECT w.thermal_asset_id,
                           slot.hour_start + make_interval(mins => ta.reading_minute::int) AS observed_at
                    FROM asset_window w
                    JOIN thermal_assets ta ON ta.id = w.thermal_asset_id
                    CROSS JOIN LATERAL generate_series(
                        date_trunc('hour', w.first_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' - interval '1 hour',
                        date_trunc('hour', w.last_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC',
                        interval '1 hour'
                    ) AS slot(hour_start)
                )
                INSERT INTO temperature_readings (
                    thermal_asset_id, source, message_id, trigger_type,
                    observed_at, received_at, temperature_c, temperature_status
                )
                SELECT h.thermal_asset_id, 'SEED',
                       'DEMO-HOURLY:' || ta.asset_code || ':' ||
                           to_char(h.observed_at AT TIME ZONE 'UTC', 'YYYYMMDDHH24MI'),
                       'SEED', h.observed_at, h.observed_at + interval '1 minute',
                       (p.target_c + (((h.thermal_asset_id +
                           (extract(epoch FROM h.observed_at)::bigint / 3600)) % 11) - 5) * 0.1)::numeric(5,2),
                       'NORMAL'
                FROM hours h
                JOIN thermal_assets ta ON ta.id = h.thermal_asset_id
                JOIN temperature_profiles p ON p.asset_type = ta.asset_type
                JOIN asset_window w ON w.thermal_asset_id = h.thermal_asset_id
                WHERE h.observed_at <= w.last_at
                ON CONFLICT (source, message_id) DO NOTHING
                SQL);

            DB::statement(<<<'SQL'
                WITH delivery AS (
                    SELECT shipment_id, max(occurred_at) AS delivered_at
                    FROM shipment_events WHERE event_code = 'DELIVERED'
                    GROUP BY shipment_id
                ), assignment_window AS (
                    SELECT a.*,
                           CASE WHEN d.delivered_at IS NOT NULL
                                THEN least(coalesce(a.ended_at, d.delivered_at), d.delivered_at)
                                ELSE coalesce(a.ended_at, a.started_at + interval '2 hours')
                           END AS last_at
                    FROM shipment_asset_assignments a
                    LEFT JOIN delivery d ON d.shipment_id = a.shipment_id
                ), scheduled AS (
                    SELECT a.shipment_id, a.id AS assignment_id, r.id AS reading_id,
                           r.observed_at AS associated_at, 'SCHEDULED' AS association_kind
                    FROM assignment_window a
                    JOIN thermal_assets ta ON ta.id = a.thermal_asset_id
                    JOIN temperature_readings r
                      ON r.thermal_asset_id = a.thermal_asset_id
                     AND r.source = 'SEED' AND r.message_id LIKE 'DEMO-HOURLY:%'
                     AND extract(minute FROM r.observed_at AT TIME ZONE 'UTC')::int = ta.reading_minute
                     AND r.observed_at >= a.started_at
                     AND r.observed_at <= a.last_at
                ), handoffs AS (
                    SELECT a.shipment_id, a.id AS assignment_id, r.id AS reading_id,
                           a.started_at AS associated_at, 'HANDOFF' AS association_kind
                    FROM assignment_window a
                    JOIN thermal_assets ta ON ta.id = a.thermal_asset_id
                    JOIN LATERAL (
                        SELECT id FROM temperature_readings r
                        WHERE r.thermal_asset_id = a.thermal_asset_id
                          AND r.source = 'SEED' AND r.message_id LIKE 'DEMO-HOURLY:%'
                          AND extract(minute FROM r.observed_at AT TIME ZONE 'UTC')::int = ta.reading_minute
                          AND r.observed_at <= a.started_at
                        ORDER BY r.observed_at DESC, r.id DESC LIMIT 1
                    ) r ON true
                    WHERE a.started_at <= a.last_at
                ), candidates AS (
                    SELECT * FROM scheduled UNION ALL SELECT * FROM handoffs
                ), chosen AS (
                    SELECT DISTINCT ON (assignment_id, reading_id) *
                    FROM candidates
                    ORDER BY assignment_id, reading_id,
                             CASE association_kind WHEN 'HANDOFF' THEN 0 ELSE 1 END
                )
                INSERT INTO shipment_temperature_samples (
                    shipment_id, assignment_id, temperature_reading_id,
                    observed_at, associated_at, association_kind,
                    temperature_c, temperature_status, source, trigger_type
                )
                SELECT c.shipment_id, c.assignment_id, r.id,
                       r.observed_at, c.associated_at, c.association_kind,
                       r.temperature_c, r.temperature_status, r.source, r.trigger_type
                FROM chosen c JOIN temperature_readings r ON r.id = c.reading_id
                ON CONFLICT (assignment_id, temperature_reading_id) DO UPDATE SET
                    associated_at = EXCLUDED.associated_at,
                    association_kind = EXCLUDED.association_kind
                SQL);

            // Keep at most eight snapshots per active shipment, without
            // discarding live readings just because the demo was rebuilt.
            DB::statement(<<<'SQL'
                WITH active AS (
                    SELECT s.id FROM shipments s
                    WHERE NOT EXISTS (
                        SELECT 1 FROM shipment_events e
                        WHERE e.shipment_id = s.id AND e.event_code = 'DELIVERED'
                    )
                ), ranked AS (
                    SELECT sample.id, sample.source,
                           row_number() OVER (
                               PARTITION BY sample.shipment_id
                               ORDER BY CASE WHEN sample.source = 'SEED' THEN 1 ELSE 0 END,
                                        sample.associated_at DESC, sample.id DESC
                           ) AS position
                    FROM shipment_temperature_samples sample
                    JOIN active a ON a.id = sample.shipment_id
                )
                DELETE FROM shipment_temperature_samples sample
                USING ranked r
                WHERE sample.id = r.id AND r.source = 'SEED' AND r.position > 8
                SQL);

            DB::statement(<<<'SQL'
                WITH ranked AS (
                    SELECT id, source,
                           row_number() OVER (
                               PARTITION BY thermal_asset_id
                               ORDER BY CASE WHEN source = 'SEED' THEN 1 ELSE 0 END,
                                        observed_at DESC, id DESC
                           ) AS position
                    FROM temperature_readings
                )
                DELETE FROM temperature_readings reading
                USING ranked r
                WHERE reading.id = r.id AND r.source = 'SEED' AND r.position > 8
                SQL);
        });

        foreach ($awbs as $awb) {
            CapstoneTrackingService::forgetCachedShipment($awb);
        }

        $samples = DB::table('shipment_temperature_samples')->where('source', 'SEED')->count();

        return ['shipments' => count($awbs), 'samples' => $samples];
    }
}
