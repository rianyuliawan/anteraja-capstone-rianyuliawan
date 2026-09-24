-- Anteraja Frozen - PostgreSQL DDL
-- Target: PostgreSQL 15+
-- Scope: public AWB tracking, illustrative route, shipment events,
-- thermal-asset assignments, and temperature readings.
--
-- Dataset coverage:
-- The seed consists of thirteen related CSV files, including shipment parties,
-- couriers, delivery confirmations, and event media. Text record IDs are retained in nullable
-- seed_* columns while the database uses bigint identity primary keys.
-- The shipment CSV also contains denormalized current-state fields. Load all
-- CSV files into the seed schema for reconciliation; events remain the
-- production source of truth for shipment status.

BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE SCHEMA IF NOT EXISTS seed;

-- ---------------------------------------------------------------------------
-- Shared trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Reference tables
-- ---------------------------------------------------------------------------

CREATE TABLE temperature_profiles (
    asset_type          varchar(30) PRIMARY KEY,
    target_c            numeric(5,2) NOT NULL,
    normal_low_c        numeric(5,2) NOT NULL,
    normal_high_c       numeric(5,2) NOT NULL,
    warning_low_c       numeric(5,2) NOT NULL,
    warning_high_c      numeric(5,2) NOT NULL,
    source_url          text,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT temperature_profiles_asset_type_chk
        CHECK (asset_type IN ('COOLER_BAG', 'HUB_FREEZER', 'MOBIL_BOX')),
    CONSTRAINT temperature_profiles_threshold_order_chk
        CHECK (
            warning_low_c < normal_low_c
            AND normal_low_c <= target_c
            AND target_c <= normal_high_c
            AND normal_high_c < warning_high_c
        )
);

CREATE TRIGGER temperature_profiles_set_updated_at
BEFORE UPDATE ON temperature_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE hubs (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code                varchar(30) NOT NULL,
    name                varchar(120) NOT NULL,
    area                varchar(120) NOT NULL,
    latitude            numeric(9,6) NOT NULL,
    longitude           numeric(9,6) NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT hubs_code_uq UNIQUE (code),
    CONSTRAINT hubs_code_format_chk CHECK (code ~ '^[A-Z0-9][A-Z0-9-]{1,29}$'),
    CONSTRAINT hubs_latitude_chk CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT hubs_longitude_chk CHECK (longitude BETWEEN -180 AND 180)
);

CREATE TRIGGER hubs_set_updated_at
BEFORE UPDATE ON hubs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE couriers (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    courier_code        varchar(30) NOT NULL,
    display_name        varchar(120) NOT NULL,
    is_active           boolean NOT NULL DEFAULT true,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT couriers_code_uq UNIQUE (courier_code),
    CONSTRAINT couriers_code_format_chk CHECK (courier_code ~ '^[A-Z0-9][A-Z0-9-]{1,29}$'),
    CONSTRAINT couriers_display_name_chk CHECK (length(btrim(display_name)) >= 2)
);

CREATE TRIGGER couriers_set_updated_at
BEFORE UPDATE ON couriers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Shipment and route
-- ---------------------------------------------------------------------------

CREATE TABLE shipments (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    awb                 varchar(50) NOT NULL,
    pickup_area         varchar(120) NOT NULL,
    pickup_point        varchar(180) NOT NULL,
    delivery_area       varchar(120) NOT NULL,
    delivery_point      varchar(180) NOT NULL,
    sender_name         varchar(160),
    recipient_name      varchar(160),
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT shipments_awb_uq UNIQUE (awb),
    CONSTRAINT shipments_awb_format_chk
        CHECK (awb ~ '^[A-Z0-9][A-Z0-9-]{5,49}$'),
    CONSTRAINT shipments_sender_name_chk
        CHECK (sender_name IS NULL OR length(btrim(sender_name)) >= 2),
    CONSTRAINT shipments_recipient_name_chk
        CHECK (recipient_name IS NULL OR length(btrim(recipient_name)) >= 2)
);

CREATE TRIGGER shipments_set_updated_at
BEFORE UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE route_stops (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seed_route_stop_id  varchar(30),
    shipment_id         bigint NOT NULL,
    hub_id              bigint,
    stop_order          smallint NOT NULL,
    point_type          varchar(20) NOT NULL,
    display_name        varchar(180) NOT NULL,
    latitude            numeric(9,6) NOT NULL,
    longitude           numeric(9,6) NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT route_stops_shipment_fk
        FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    CONSTRAINT route_stops_hub_fk
        FOREIGN KEY (hub_id) REFERENCES hubs(id) ON DELETE RESTRICT,
    CONSTRAINT route_stops_seed_id_uq UNIQUE (seed_route_stop_id),
    CONSTRAINT route_stops_order_uq UNIQUE (shipment_id, stop_order),
    CONSTRAINT route_stops_order_chk CHECK (stop_order >= 0),
    CONSTRAINT route_stops_point_type_chk
        CHECK (point_type IN ('PICKUP', 'HUB', 'DELIVERY')),
    CONSTRAINT route_stops_hub_presence_chk
        CHECK (
            (point_type = 'HUB' AND hub_id IS NOT NULL)
            OR (point_type IN ('PICKUP', 'DELIVERY') AND hub_id IS NULL)
        ),
    CONSTRAINT route_stops_latitude_chk CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT route_stops_longitude_chk CHECK (longitude BETWEEN -180 AND 180)
);

CREATE TRIGGER route_stops_set_updated_at
BEFORE UPDATE ON route_stops
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE shipment_events (
    id                      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seed_event_id           varchar(30),
    shipment_id             bigint NOT NULL,
    hub_id                  bigint,
    courier_id              bigint,
    stage                   varchar(30) NOT NULL,
    event_code              varchar(30) NOT NULL,
    occurred_at             timestamptz NOT NULL,
    completed_stop_order    smallint,
    source                  varchar(30) NOT NULL DEFAULT 'SEED',
    source_event_key        varchar(120),
    created_at              timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT shipment_events_shipment_fk
        FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    CONSTRAINT shipment_events_hub_fk
        FOREIGN KEY (hub_id) REFERENCES hubs(id) ON DELETE RESTRICT,
    CONSTRAINT shipment_events_courier_fk
        FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE RESTRICT,
    CONSTRAINT shipment_events_seed_id_uq UNIQUE (seed_event_id),
    CONSTRAINT shipment_events_route_stop_fk
        FOREIGN KEY (shipment_id, completed_stop_order)
        REFERENCES route_stops (shipment_id, stop_order)
        ON DELETE RESTRICT,
    CONSTRAINT shipment_events_stage_chk
        CHECK (stage IN (
            'PICKED_UP', 'AT_HUB', 'IN_TRANSIT',
            'OUT_FOR_DELIVERY', 'DELIVERED'
        )),
    CONSTRAINT shipment_events_code_chk
        CHECK (event_code IN (
            'PICKED_UP', 'ARRIVED_HUB', 'LEFT_HUB', 'IN_TRANSIT',
            'OUT_FOR_DELIVERY', 'DELIVERED'
        )),
    CONSTRAINT shipment_events_code_stage_chk
        CHECK (
            (event_code = 'PICKED_UP' AND stage = 'PICKED_UP')
            OR (event_code = 'ARRIVED_HUB' AND stage = 'AT_HUB')
            OR (event_code IN ('LEFT_HUB', 'IN_TRANSIT') AND stage = 'IN_TRANSIT')
            OR (event_code = 'OUT_FOR_DELIVERY' AND stage = 'OUT_FOR_DELIVERY')
            OR (event_code = 'DELIVERED' AND stage = 'DELIVERED')
        ),
    CONSTRAINT shipment_events_hub_presence_chk
        CHECK (
            event_code NOT IN ('ARRIVED_HUB', 'LEFT_HUB')
            OR hub_id IS NOT NULL
        ),
    CONSTRAINT shipment_events_courier_event_chk
        CHECK (courier_id IS NULL OR event_code IN ('PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED')),
    CONSTRAINT shipment_events_completed_order_chk
        CHECK (completed_stop_order IS NULL OR completed_stop_order >= 0)
);

CREATE UNIQUE INDEX shipment_events_source_key_uq
    ON shipment_events (source, source_event_key)
    WHERE source_event_key IS NOT NULL;

CREATE INDEX shipment_events_latest_idx
    ON shipment_events (shipment_id, occurred_at DESC, id DESC);

CREATE INDEX shipment_events_hub_idx
    ON shipment_events (hub_id, occurred_at DESC)
    WHERE hub_id IS NOT NULL;

CREATE INDEX shipment_events_courier_idx
    ON shipment_events (courier_id, occurred_at DESC)
    WHERE courier_id IS NOT NULL;

CREATE TABLE delivery_confirmations (
    shipment_event_id       bigint PRIMARY KEY,
    receipt_type            varchar(30) NOT NULL,
    received_by_name        varchar(160),
    placement_note          varchar(255),
    confirmed_at            timestamptz NOT NULL,
    created_at              timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT delivery_confirmations_event_fk
        FOREIGN KEY (shipment_event_id) REFERENCES shipment_events(id) ON DELETE CASCADE,
    CONSTRAINT delivery_confirmations_type_chk
        CHECK (receipt_type IN ('RECIPIENT', 'FAMILY', 'SECURITY', 'RECEPTION', 'SAFE_PLACE')),
    CONSTRAINT delivery_confirmations_receiver_chk
        CHECK (received_by_name IS NULL OR length(btrim(received_by_name)) >= 2),
    CONSTRAINT delivery_confirmations_note_chk
        CHECK (placement_note IS NULL OR length(btrim(placement_note)) >= 3)
);

CREATE OR REPLACE FUNCTION validate_delivery_confirmation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM shipment_events
        WHERE id = NEW.shipment_event_id AND event_code = 'DELIVERED'
    ) THEN
        RAISE EXCEPTION 'delivery confirmation must reference a DELIVERED event';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER delivery_confirmations_validate_event
BEFORE INSERT OR UPDATE OF shipment_event_id
ON delivery_confirmations
FOR EACH ROW EXECUTE FUNCTION validate_delivery_confirmation();

-- Image files stay in private Laravel/object storage. This table stores only
-- the storage key and metadata needed to authorize, render, and audit them.
CREATE TABLE shipment_event_media (
    id                      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seed_media_id           varchar(30),
    shipment_event_id       bigint NOT NULL,
    media_type              varchar(30) NOT NULL,
    storage_disk            varchar(30) NOT NULL DEFAULT 'private',
    storage_key             varchar(512) NOT NULL,
    mime_type               varchar(50) NOT NULL,
    file_size_bytes         integer NOT NULL,
    width_px                integer NOT NULL,
    height_px               integer NOT NULL,
    captured_at             timestamptz NOT NULL,
    alt_text                varchar(255) NOT NULL,
    privacy_status          varchar(20) NOT NULL DEFAULT 'PENDING',
    checksum_sha256         varchar(64) NOT NULL,
    created_at              timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT shipment_event_media_event_fk
        FOREIGN KEY (shipment_event_id)
        REFERENCES shipment_events(id) ON DELETE CASCADE,
    CONSTRAINT shipment_event_media_seed_id_uq UNIQUE (seed_media_id),
    CONSTRAINT shipment_event_media_storage_key_uq UNIQUE (storage_disk, storage_key),
    CONSTRAINT shipment_event_media_event_type_uq UNIQUE (shipment_event_id, media_type),
    CONSTRAINT shipment_event_media_type_chk
        CHECK (media_type IN ('PICKUP_PHOTO', 'DELIVERY_PHOTO')),
    CONSTRAINT shipment_event_media_mime_chk
        CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    CONSTRAINT shipment_event_media_size_chk
        CHECK (file_size_bytes BETWEEN 1 AND 10485760),
    CONSTRAINT shipment_event_media_dimensions_chk
        CHECK (width_px BETWEEN 1 AND 10000 AND height_px BETWEEN 1 AND 10000),
    CONSTRAINT shipment_event_media_privacy_chk
        CHECK (privacy_status IN ('PENDING', 'APPROVED', 'REDACTED', 'REJECTED')),
    CONSTRAINT shipment_event_media_checksum_chk
        CHECK (checksum_sha256 ~ '^[0-9a-f]{64}$')
);

CREATE INDEX shipment_event_media_public_idx
    ON shipment_event_media (shipment_event_id, captured_at DESC)
    WHERE privacy_status IN ('APPROVED', 'REDACTED');

CREATE OR REPLACE FUNCTION validate_shipment_event_media()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    linked_event_code varchar(30);
BEGIN
    SELECT event_code
    INTO linked_event_code
    FROM shipment_events
    WHERE id = NEW.shipment_event_id;

    IF (NEW.media_type = 'PICKUP_PHOTO' AND linked_event_code <> 'PICKED_UP')
       OR (NEW.media_type = 'DELIVERY_PHOTO' AND linked_event_code <> 'DELIVERED') THEN
        RAISE EXCEPTION 'media_type % does not match shipment event %',
            NEW.media_type, linked_event_code;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER shipment_event_media_validate_event
BEFORE INSERT OR UPDATE OF shipment_event_id, media_type
ON shipment_event_media
FOR EACH ROW EXECUTE FUNCTION validate_shipment_event_media();

-- ---------------------------------------------------------------------------
-- Thermal assets and temperature readings
-- ---------------------------------------------------------------------------

CREATE TABLE thermal_assets (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    asset_code          varchar(50) NOT NULL,
    asset_type          varchar(30) NOT NULL,
    display_name        varchar(120) NOT NULL,
    is_active           boolean NOT NULL DEFAULT true,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT thermal_assets_code_uq UNIQUE (asset_code),
    CONSTRAINT thermal_assets_profile_fk
        FOREIGN KEY (asset_type)
        REFERENCES temperature_profiles(asset_type)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT thermal_assets_code_format_chk
        CHECK (asset_code ~ '^[A-Z0-9][A-Z0-9-]{1,49}$')
);

CREATE INDEX thermal_assets_type_active_idx
    ON thermal_assets (asset_type, is_active);

CREATE TRIGGER thermal_assets_set_updated_at
BEFORE UPDATE ON thermal_assets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE shipment_asset_assignments (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seed_assignment_id  varchar(30),
    shipment_id         bigint NOT NULL,
    thermal_asset_id    bigint NOT NULL,
    segment             varchar(30) NOT NULL,
    started_at          timestamptz NOT NULL,
    ended_at            timestamptz,
    active_period       tstzrange GENERATED ALWAYS AS
                        (tstzrange(started_at, ended_at, '[)')) STORED,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT assignments_shipment_fk
        FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    CONSTRAINT assignments_asset_fk
        FOREIGN KEY (thermal_asset_id) REFERENCES thermal_assets(id) ON DELETE RESTRICT,
    CONSTRAINT assignments_seed_id_uq UNIQUE (seed_assignment_id),
    CONSTRAINT assignments_segment_chk
        CHECK (segment IN ('PICKUP', 'AT_HUB', 'IN_TRANSIT', 'LAST_MILE')),
    CONSTRAINT assignments_time_order_chk
        CHECK (ended_at IS NULL OR ended_at > started_at),
    CONSTRAINT assignments_start_uq UNIQUE (shipment_id, started_at),
    CONSTRAINT assignments_no_overlap_excl
        EXCLUDE USING gist (
            shipment_id WITH =,
            active_period WITH &&
        )
        DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX assignments_asset_period_idx
    ON shipment_asset_assignments USING gist (thermal_asset_id, active_period);

CREATE INDEX assignments_active_asset_idx
    ON shipment_asset_assignments (thermal_asset_id, started_at DESC)
    WHERE ended_at IS NULL;

CREATE UNIQUE INDEX assignments_active_shipment_uq
    ON shipment_asset_assignments (shipment_id)
    WHERE ended_at IS NULL;

CREATE TRIGGER assignments_set_updated_at
BEFORE UPDATE ON shipment_asset_assignments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE temperature_readings (
    id                      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seed_reading_id         varchar(30),
    thermal_asset_id        bigint NOT NULL,
    source                  varchar(30) NOT NULL,
    message_id              varchar(120) NOT NULL,
    request_id              uuid,
    trigger_type            varchar(20) NOT NULL,
    observed_at             timestamptz NOT NULL,
    received_at             timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    temperature_c           numeric(5,2) NOT NULL,
    temperature_status      varchar(20),
    created_at              timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT temperature_readings_asset_fk
        FOREIGN KEY (thermal_asset_id) REFERENCES thermal_assets(id) ON DELETE RESTRICT,
    CONSTRAINT temperature_readings_seed_id_uq UNIQUE (seed_reading_id),
    CONSTRAINT temperature_readings_message_uq UNIQUE (source, message_id),
    CONSTRAINT temperature_readings_source_chk
        CHECK (source IN ('SEED', 'NODE_RED', 'IOT')),
    CONSTRAINT temperature_readings_trigger_chk
        CHECK (trigger_type IN ('SEED', 'SCHEDULED', 'ON_DEMAND')),
    CONSTRAINT temperature_readings_status_chk
        CHECK (
            temperature_status IS NULL
            OR temperature_status IN ('NORMAL', 'WARNING', 'CRITICAL')
        ),
    CONSTRAINT temperature_readings_value_chk
        CHECK (temperature_c BETWEEN -100 AND 100),
    CONSTRAINT temperature_readings_time_chk
        CHECK (received_at >= observed_at - interval '5 minutes'),
    CONSTRAINT temperature_readings_request_chk
        CHECK (
            (trigger_type = 'ON_DEMAND' AND request_id IS NOT NULL)
            OR (trigger_type <> 'ON_DEMAND' AND request_id IS NULL)
        )
);

CREATE UNIQUE INDEX temperature_readings_request_uq
    ON temperature_readings (thermal_asset_id, request_id)
    WHERE request_id IS NOT NULL;

CREATE INDEX temperature_readings_asset_time_idx
    ON temperature_readings (thermal_asset_id, observed_at DESC, id DESC);

CREATE INDEX temperature_readings_anomaly_idx
    ON temperature_readings (thermal_asset_id, observed_at DESC)
    WHERE temperature_status IN ('WARNING', 'CRITICAL');

-- ---------------------------------------------------------------------------
-- Raw seed tables
-- Import the thirteen CSV files here first, then run the separate seed transform.
-- ---------------------------------------------------------------------------

CREATE TABLE seed.shipments (
    awb                     varchar(50) NOT NULL,
    pickup_area             varchar(120) NOT NULL,
    pickup_point            varchar(180) NOT NULL,
    delivery_area           varchar(120) NOT NULL,
    delivery_point          varchar(180) NOT NULL,
    current_stage           varchar(30) NOT NULL,
    pickup_at               timestamptz NOT NULL,
    last_stage_at           timestamptz NOT NULL,
    completed_stop_order    smallint NOT NULL,
    route_hub_count         smallint NOT NULL,
    scenario_key            varchar(80) NOT NULL,
    loaded_at               timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT seed_shipments_pk PRIMARY KEY (awb),
    CONSTRAINT seed_shipments_stage_chk
        CHECK (current_stage IN (
            'PICKED_UP', 'AT_HUB', 'IN_TRANSIT',
            'OUT_FOR_DELIVERY', 'DELIVERED'
        )),
    CONSTRAINT seed_shipments_time_chk
        CHECK (last_stage_at >= pickup_at),
    CONSTRAINT seed_shipments_completed_stop_chk
        CHECK (completed_stop_order >= 0),
    CONSTRAINT seed_shipments_hub_count_chk
        CHECK (route_hub_count >= 0),
    CONSTRAINT seed_shipments_scenario_chk
        CHECK (scenario_key = current_stage || '_' || route_hub_count || 'HUB')
);

CREATE TABLE seed.hubs (
    hub_code                varchar(30) PRIMARY KEY,
    display_name            varchar(120) NOT NULL,
    area                    varchar(120) NOT NULL,
    latitude                numeric(9,6) NOT NULL,
    longitude               numeric(9,6) NOT NULL,
    loaded_at               timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seed.route_stops (
    route_stop_id           varchar(30) PRIMARY KEY,
    awb                     varchar(50) NOT NULL,
    stop_order              smallint NOT NULL,
    point_type              varchar(20) NOT NULL,
    hub_code                varchar(30),
    display_name            varchar(180) NOT NULL,
    latitude                numeric(9,6) NOT NULL,
    longitude               numeric(9,6) NOT NULL,
    loaded_at               timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT seed_route_stops_order_uq UNIQUE (awb, stop_order)
);

CREATE TABLE seed.shipment_events (
    event_id                varchar(30) PRIMARY KEY,
    awb                     varchar(50) NOT NULL,
    event_code              varchar(30) NOT NULL,
    stage                   varchar(30) NOT NULL,
    occurred_at             timestamptz NOT NULL,
    hub_code                varchar(30),
    completed_stop_order    smallint,
    source_event_key        varchar(120) NOT NULL UNIQUE,
    loaded_at               timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seed.shipment_parties (
    awb                     varchar(50) PRIMARY KEY,
    sender_name             varchar(160) NOT NULL,
    recipient_name          varchar(160) NOT NULL,
    loaded_at               timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seed.couriers (
    courier_code            varchar(30) PRIMARY KEY,
    display_name            varchar(120) NOT NULL,
    loaded_at               timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seed.shipment_event_couriers (
    event_id                varchar(30) PRIMARY KEY,
    courier_code            varchar(30) NOT NULL,
    loaded_at               timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seed.delivery_confirmations (
    event_id                varchar(30) PRIMARY KEY,
    receipt_type            varchar(30) NOT NULL,
    received_by_name        varchar(160),
    placement_note          varchar(255),
    confirmed_at            timestamptz NOT NULL,
    loaded_at               timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seed.shipment_event_media (
    media_id                varchar(30) PRIMARY KEY,
    event_id                varchar(30) NOT NULL,
    media_type              varchar(30) NOT NULL,
    storage_disk            varchar(30) NOT NULL,
    storage_key             varchar(512) NOT NULL,
    mime_type               varchar(50) NOT NULL,
    file_size_bytes         integer NOT NULL,
    width_px                integer NOT NULL,
    height_px               integer NOT NULL,
    captured_at             timestamptz NOT NULL,
    alt_text                varchar(255) NOT NULL,
    privacy_status          varchar(20) NOT NULL,
    checksum_sha256         varchar(64) NOT NULL,
    loaded_at               timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seed.temperature_profiles (
    asset_type              varchar(30) PRIMARY KEY,
    target_c                numeric(5,2) NOT NULL,
    normal_low_c            numeric(5,2) NOT NULL,
    normal_high_c           numeric(5,2) NOT NULL,
    warning_low_c           numeric(5,2) NOT NULL,
    warning_high_c          numeric(5,2) NOT NULL,
    source_url              text,
    loaded_at               timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seed.thermal_assets (
    asset_code              varchar(50) PRIMARY KEY,
    asset_type              varchar(30) NOT NULL,
    display_name            varchar(120) NOT NULL,
    loaded_at               timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seed.shipment_asset_assignments (
    assignment_id           varchar(30) PRIMARY KEY,
    awb                     varchar(50) NOT NULL,
    asset_code              varchar(50) NOT NULL,
    asset_type              varchar(30) NOT NULL,
    segment                 varchar(30) NOT NULL,
    started_at              timestamptz NOT NULL,
    ended_at                timestamptz,
    loaded_at               timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seed.temperature_readings (
    reading_id              varchar(30) PRIMARY KEY,
    asset_code              varchar(50) NOT NULL,
    source                  varchar(30) NOT NULL,
    message_id              varchar(120) NOT NULL,
    request_id              uuid,
    trigger_type            varchar(20) NOT NULL,
    observed_at             timestamptz NOT NULL,
    received_at             timestamptz NOT NULL,
    temperature_c           numeric(5,2) NOT NULL,
    temperature_status      varchar(20),
    loaded_at               timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT seed_temperature_readings_message_uq UNIQUE (source, message_id)
);

COMMENT ON SCHEMA seed IS
    'Raw CSV seed data. Application reads normalized public tables, not this schema.';

COMMENT ON COLUMN route_stops.seed_route_stop_id IS
    'Optional route_stop_id from the seed dataset, for example RS-00001.';

COMMENT ON COLUMN shipment_events.seed_event_id IS
    'Optional event_id from the seed dataset, for example EV-00001.';

COMMENT ON COLUMN shipment_event_media.storage_key IS
    'Private storage key used by Laravel to issue a short-lived signed URL; never serialize this value directly to public clients.';

COMMENT ON COLUMN shipment_asset_assignments.seed_assignment_id IS
    'Optional assignment_id from the seed dataset, for example AS-00001.';

COMMENT ON COLUMN temperature_readings.seed_reading_id IS
    'Optional reading_id from the seed dataset, for example TR-00001.';

-- ---------------------------------------------------------------------------
-- Read views for the Laravel tracking API
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION mask_public_name(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
RETURNS NULL ON NULL INPUT
AS $$
    SELECT CASE
        WHEN length(btrim(value)) <= 2 THEN left(btrim(value), 1) || '*'
        ELSE left(btrim(value), 1)
             || repeat('*', greatest(length(btrim(value)) - 2, 1))
             || right(btrim(value), 1)
    END;
$$;

CREATE VIEW shipment_current_status AS
SELECT DISTINCT ON (e.shipment_id)
    e.shipment_id,
    e.stage AS current_stage,
    e.event_code AS current_event_code,
    e.occurred_at AS last_stage_at,
    e.completed_stop_order,
    e.id AS shipment_event_id
FROM shipment_events e
ORDER BY e.shipment_id, e.occurred_at DESC, e.id DESC;

CREATE VIEW shipment_public_summary AS
SELECT
    s.id AS shipment_id,
    s.awb,
    mask_public_name(s.sender_name) AS sender_name_masked,
    mask_public_name(s.recipient_name) AS recipient_name_masked,
    s.pickup_area,
    s.delivery_area,
    cs.current_stage,
    cs.current_event_code,
    cs.last_stage_at
FROM shipments s
LEFT JOIN shipment_current_status cs ON cs.shipment_id = s.id;

CREATE VIEW shipment_public_timeline AS
SELECT
    e.shipment_id,
    e.id AS shipment_event_id,
    e.stage,
    e.event_code,
    e.occurred_at,
    h.name AS hub_name,
    c.display_name AS courier_display_name,
    dc.receipt_type,
    mask_public_name(dc.received_by_name) AS received_by_masked,
    dc.placement_note,
    dc.confirmed_at
FROM shipment_events e
LEFT JOIN hubs h ON h.id = e.hub_id
LEFT JOIN couriers c ON c.id = e.courier_id
LEFT JOIN delivery_confirmations dc ON dc.shipment_event_id = e.id;

CREATE VIEW shipment_public_event_media AS
SELECT
    e.shipment_id,
    m.shipment_event_id,
    e.event_code,
    m.id AS media_id,
    m.media_type,
    m.storage_disk,
    m.storage_key,
    m.mime_type,
    m.width_px,
    m.height_px,
    m.captured_at,
    m.alt_text,
    m.privacy_status
FROM shipment_event_media m
JOIN shipment_events e ON e.id = m.shipment_event_id
WHERE m.privacy_status IN ('APPROVED', 'REDACTED');

CREATE VIEW shipment_temperature_history AS
SELECT
    a.shipment_id,
    a.id AS assignment_id,
    a.segment,
    a.thermal_asset_id,
    ta.asset_code,
    ta.asset_type,
    r.id AS temperature_reading_id,
    r.observed_at,
    r.temperature_c,
    r.temperature_status,
    r.source,
    r.trigger_type
FROM shipment_asset_assignments a
JOIN thermal_assets ta
  ON ta.id = a.thermal_asset_id
JOIN temperature_readings r
  ON r.thermal_asset_id = a.thermal_asset_id
 AND r.observed_at <@ a.active_period;

CREATE VIEW shipment_latest_temperature AS
SELECT DISTINCT ON (h.shipment_id)
    h.shipment_id,
    h.assignment_id,
    h.segment,
    h.thermal_asset_id,
    h.asset_code,
    h.asset_type,
    h.temperature_reading_id,
    h.observed_at,
    h.temperature_c,
    h.temperature_status,
    h.source,
    h.trigger_type
FROM shipment_temperature_history h
ORDER BY h.shipment_id, h.observed_at DESC, h.temperature_reading_id DESC;

COMMENT ON VIEW shipment_temperature_history IS
    'A reading is visible to an AWB only while the AWB assignment to that asset is active.';

COMMENT ON VIEW shipment_latest_temperature IS
    'Latest valid asset reading per shipment; delivered shipments receive no new readings after assignment closure.';

COMMENT ON VIEW shipment_public_event_media IS
    'Privacy-cleared pickup and delivery media. Laravel converts storage keys to short-lived signed URLs before responding.';

COMMENT ON VIEW shipment_public_summary IS
    'Batch-search projection with masked party names; Laravel must still filter by the AWBs supplied in the request.';

COMMENT ON VIEW shipment_public_timeline IS
    'Timeline projection with courier display name and privacy-safe delivered confirmation fields.';

COMMIT;
