-- Anteraja Frozen - transform raw CSV seed into normalized production tables
-- Prerequisite: run anteraja_frozen_schema.sql, then import all nine CSV files
-- into the matching tables in schema seed.

BEGIN;

DO $$
DECLARE
    mismatch_count integer;
BEGIN
    SELECT count(*)
      INTO mismatch_count
      FROM seed.shipment_asset_assignments a
      LEFT JOIN seed.thermal_assets t ON t.asset_code = a.asset_code
     WHERE t.asset_code IS NULL OR t.asset_type <> a.asset_type;

    IF mismatch_count > 0 THEN
        RAISE EXCEPTION '% assignment rows have an unknown asset or mismatched asset_type', mismatch_count;
    END IF;
END;
$$;

INSERT INTO temperature_profiles (
    asset_type, target_c, normal_low_c, normal_high_c,
    warning_low_c, warning_high_c, source_url
)
SELECT
    asset_type, target_c, normal_low_c, normal_high_c,
    warning_low_c, warning_high_c, nullif(source_url, '')
FROM seed.temperature_profiles
ON CONFLICT (asset_type) DO UPDATE SET
    target_c = EXCLUDED.target_c,
    normal_low_c = EXCLUDED.normal_low_c,
    normal_high_c = EXCLUDED.normal_high_c,
    warning_low_c = EXCLUDED.warning_low_c,
    warning_high_c = EXCLUDED.warning_high_c,
    source_url = EXCLUDED.source_url;

INSERT INTO hubs (code, name, area, latitude, longitude)
SELECT hub_code, display_name, area, latitude, longitude
FROM seed.hubs
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    area = EXCLUDED.area,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;

INSERT INTO thermal_assets (asset_code, asset_type, display_name)
SELECT asset_code, asset_type, display_name
FROM seed.thermal_assets
ON CONFLICT (asset_code) DO UPDATE SET
    asset_type = EXCLUDED.asset_type,
    display_name = EXCLUDED.display_name,
    is_active = true;

INSERT INTO shipments (
    awb, pickup_area, pickup_point, delivery_area, delivery_point
)
SELECT awb, pickup_area, pickup_point, delivery_area, delivery_point
FROM seed.shipments
ON CONFLICT (awb) DO UPDATE SET
    pickup_area = EXCLUDED.pickup_area,
    pickup_point = EXCLUDED.pickup_point,
    delivery_area = EXCLUDED.delivery_area,
    delivery_point = EXCLUDED.delivery_point;

INSERT INTO route_stops (
    seed_route_stop_id, shipment_id, hub_id, stop_order,
    point_type, display_name, latitude, longitude
)
SELECT
    r.route_stop_id,
    s.id,
    h.id,
    r.stop_order,
    r.point_type,
    r.display_name,
    r.latitude,
    r.longitude
FROM seed.route_stops r
JOIN shipments s ON s.awb = r.awb
LEFT JOIN hubs h ON h.code = r.hub_code
ON CONFLICT (seed_route_stop_id) DO UPDATE SET
    shipment_id = EXCLUDED.shipment_id,
    hub_id = EXCLUDED.hub_id,
    stop_order = EXCLUDED.stop_order,
    point_type = EXCLUDED.point_type,
    display_name = EXCLUDED.display_name,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;

INSERT INTO shipment_events (
    seed_event_id, shipment_id, hub_id, stage, event_code,
    occurred_at, completed_stop_order, source, source_event_key
)
SELECT
    e.event_id,
    s.id,
    h.id,
    e.stage,
    e.event_code,
    e.occurred_at,
    e.completed_stop_order,
    'SEED',
    e.source_event_key
FROM seed.shipment_events e
JOIN shipments s ON s.awb = e.awb
LEFT JOIN hubs h ON h.code = e.hub_code
ON CONFLICT (seed_event_id) DO UPDATE SET
    shipment_id = EXCLUDED.shipment_id,
    hub_id = EXCLUDED.hub_id,
    stage = EXCLUDED.stage,
    event_code = EXCLUDED.event_code,
    occurred_at = EXCLUDED.occurred_at,
    completed_stop_order = EXCLUDED.completed_stop_order,
    source = EXCLUDED.source,
    source_event_key = EXCLUDED.source_event_key;

INSERT INTO shipment_event_media (
    seed_media_id, shipment_event_id, media_type, storage_disk, storage_key,
    mime_type, file_size_bytes, width_px, height_px, captured_at, alt_text,
    privacy_status, checksum_sha256
)
SELECT
    m.media_id,
    e.id,
    m.media_type,
    m.storage_disk,
    m.storage_key,
    m.mime_type,
    m.file_size_bytes,
    m.width_px,
    m.height_px,
    m.captured_at,
    m.alt_text,
    m.privacy_status,
    m.checksum_sha256
FROM seed.shipment_event_media m
JOIN shipment_events e ON e.seed_event_id = m.event_id
ON CONFLICT (seed_media_id) DO UPDATE SET
    shipment_event_id = EXCLUDED.shipment_event_id,
    media_type = EXCLUDED.media_type,
    storage_disk = EXCLUDED.storage_disk,
    storage_key = EXCLUDED.storage_key,
    mime_type = EXCLUDED.mime_type,
    file_size_bytes = EXCLUDED.file_size_bytes,
    width_px = EXCLUDED.width_px,
    height_px = EXCLUDED.height_px,
    captured_at = EXCLUDED.captured_at,
    alt_text = EXCLUDED.alt_text,
    privacy_status = EXCLUDED.privacy_status,
    checksum_sha256 = EXCLUDED.checksum_sha256;

INSERT INTO shipment_asset_assignments (
    seed_assignment_id, shipment_id, thermal_asset_id,
    segment, started_at, ended_at
)
SELECT
    a.assignment_id,
    s.id,
    t.id,
    a.segment,
    a.started_at,
    a.ended_at
FROM seed.shipment_asset_assignments a
JOIN shipments s ON s.awb = a.awb
JOIN thermal_assets t ON t.asset_code = a.asset_code
ON CONFLICT (seed_assignment_id) DO UPDATE SET
    shipment_id = EXCLUDED.shipment_id,
    thermal_asset_id = EXCLUDED.thermal_asset_id,
    segment = EXCLUDED.segment,
    started_at = EXCLUDED.started_at,
    ended_at = EXCLUDED.ended_at;

INSERT INTO temperature_readings (
    seed_reading_id, thermal_asset_id, source, message_id,
    request_id, trigger_type, observed_at, received_at,
    temperature_c, temperature_status
)
SELECT
    r.reading_id,
    t.id,
    r.source,
    r.message_id,
    r.request_id,
    r.trigger_type,
    r.observed_at,
    r.received_at,
    r.temperature_c,
    r.temperature_status
FROM seed.temperature_readings r
JOIN thermal_assets t ON t.asset_code = r.asset_code
ON CONFLICT (seed_reading_id) DO UPDATE SET
    thermal_asset_id = EXCLUDED.thermal_asset_id,
    source = EXCLUDED.source,
    message_id = EXCLUDED.message_id,
    request_id = EXCLUDED.request_id,
    trigger_type = EXCLUDED.trigger_type,
    observed_at = EXCLUDED.observed_at,
    received_at = EXCLUDED.received_at,
    temperature_c = EXCLUDED.temperature_c,
    temperature_status = EXCLUDED.temperature_status;

DO $$
DECLARE
    mismatch_count integer;
BEGIN
    SELECT count(*)
      INTO mismatch_count
      FROM seed.shipments raw
      JOIN shipments s ON s.awb = raw.awb
      LEFT JOIN shipment_current_status current_status
        ON current_status.shipment_id = s.id
     WHERE current_status.shipment_id IS NULL
        OR current_status.current_stage <> raw.current_stage
        OR current_status.last_stage_at <> raw.last_stage_at
        OR current_status.completed_stop_order <> raw.completed_stop_order;

    IF mismatch_count > 0 THEN
        RAISE EXCEPTION '% shipment snapshots do not match their latest event', mismatch_count;
    END IF;

    SELECT count(*)
      INTO mismatch_count
      FROM seed.shipments raw
      JOIN shipments s ON s.awb = raw.awb
      LEFT JOIN (
          SELECT shipment_id, count(*) FILTER (WHERE point_type = 'HUB') AS hub_count
          FROM route_stops
          GROUP BY shipment_id
      ) route_count ON route_count.shipment_id = s.id
     WHERE coalesce(route_count.hub_count, 0) <> raw.route_hub_count;

    IF mismatch_count > 0 THEN
        RAISE EXCEPTION '% shipment routes do not match route_hub_count', mismatch_count;
    END IF;

    SELECT count(*)
      INTO mismatch_count
      FROM seed.shipment_event_media raw
      LEFT JOIN shipment_event_media media
        ON media.seed_media_id = raw.media_id
     WHERE media.id IS NULL;

    IF mismatch_count > 0 THEN
        RAISE EXCEPTION '% shipment event media rows were not transformed', mismatch_count;
    END IF;
END;
$$;

COMMIT;

-- Expected normalized row counts for the supplied seed:
-- shipments 70; hubs 10; route_stops 266; shipment_events 274;
-- shipment_event_media 3;
-- thermal_assets 86; shipment_asset_assignments 260;
-- temperature_profiles 3; temperature_readings 400.
