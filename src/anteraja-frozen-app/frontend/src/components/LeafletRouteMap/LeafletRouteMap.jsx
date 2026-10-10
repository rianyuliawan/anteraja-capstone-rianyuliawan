import { useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FaMotorcycle, FaSnowflake, FaTruck } from "react-icons/fa";
import { FiMaximize2, FiX } from "react-icons/fi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getRoadRoute } from "../../api/roadRoute";
import RouteMap from "../RouteMap";

function halfwayAlong(positions) {
  const distances = positions
    .slice(1)
    .map((position, index) =>
      L.latLng(positions[index]).distanceTo(L.latLng(position)),
    );
  let remaining =
    distances.reduce((total, distance) => total + distance, 0) / 2;

  for (let index = 0; index < distances.length; index += 1) {
    if (remaining <= distances[index]) {
      const part = distances[index] ? remaining / distances[index] : 0;
      return [
        positions[index][0] +
          (positions[index + 1][0] - positions[index][0]) * part,
        positions[index][1] +
          (positions[index + 1][1] - positions[index][1]) * part,
      ];
    }
    remaining -= distances[index];
  }

  return positions.at(-1);
}

function assetIcon(asset, stage) {
  if (/freezer/i.test(asset)) {
    return { Icon: FaSnowflake, label: "Freezer hub", kind: "stationary" };
  }
  if (/box|boks|mobil/i.test(asset)) {
    return { Icon: FaTruck, label: "Mobil boks", kind: "moving" };
  }
  if (/bag|cooler/i.test(asset) || stage === "OUT_FOR_DELIVERY") {
    return { Icon: FaMotorcycle, label: "Kurir bermotor", kind: "moving" };
  }
  return { Icon: FaTruck, label: "Armada pengiriman", kind: "moving" };
}

function addStopMarkers(map, points, coordinates, completedIndex, stage) {
  points.forEach((point, index) => {
    const marker = document.createElement("span");
    const reached = index <= completedIndex;
    const current = index === completedIndex && stage !== "DELIVERED";
    marker.className = `route-marker ${reached ? "route-marker--reached" : ""} ${current ? "route-marker--current" : ""}`;
    marker.textContent =
      stage === "DELIVERED" && index === points.length - 1
        ? "✓"
        : String(index + 1);
    const icon = L.divIcon({
      className: "route-marker-wrapper",
      html: marker,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
    const popup = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = point.label;
    const status = document.createElement("p");
    status.className = "route-popup-status";
    status.textContent = current
      ? "Lokasi terakhir tercatat"
      : reached
        ? "Telah dilalui"
        : "Titik berikutnya";
    popup.append(title, status);
    L.marker(coordinates[index], { icon })
      .addTo(map)
      .bindPopup(popup, { closeButton: false });
  });
}

function MapCanvas({
  pointsKey,
  roadData,
  stage,
  completedIndex,
  activeAssetName,
  interactive,
  onTileFallback,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const points = JSON.parse(pointsKey);
    if (!points.length) return;
    const map = L.map(containerRef.current, {
      scrollWheelZoom: interactive,
      zoomControl: interactive,
      dragging: interactive,
      doubleClickZoom: interactive,
      keyboard: interactive,
    });
    const theme = getComputedStyle(document.documentElement);
    const brandColor =
      theme.getPropertyValue("--color-brand-500").trim() || "#ed0677";
    const mutedColor =
      theme.getPropertyValue("--color-ink-300").trim() || "#cbd5e1";
    const white = theme.getPropertyValue("--color-white").trim() || "#fff";
    const coordinates = points.map((point) =>
      L.latLng(point.latitude, point.longitude),
    );
    const isMoving = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(
      stage,
    );
    let tileLoads = 0;
    let tileErrors = 0;
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    );
    tiles.on("tileload", () => {
      tileLoads += 1;
    });
    tiles.on("tileerror", () => {
      tileErrors += 1;
      if (tileErrors >= 4 && tileLoads === 0) onTileFallback(true);
    });
    tiles.addTo(map);

    roadData?.legs.forEach((leg, index) => {
      const completed = index < completedIndex || stage === "DELIVERED";
      const active = index === completedIndex && isMoving;
      L.polyline(leg, { color: white, weight: 9, opacity: 0.9 }).addTo(map);
      L.polyline(leg, {
        color: completed || active ? brandColor : mutedColor,
        weight: completed || active ? 6 : 5,
        opacity: completed || active ? 1 : 0.9,
        dashArray: completed ? undefined : active ? "9 7" : "3 9",
        lineCap: "round",
      }).addTo(map);
    });

    addStopMarkers(map, points, coordinates, completedIndex, stage);
    if (stage !== "DELIVERED") {
      const vehicle = assetIcon(activeAssetName, stage);
      const activeLeg =
        roadData?.legs[Math.min(completedIndex, roadData.legs.length - 1)];
      const position =
        isMoving && activeLeg
          ? halfwayAlong(activeLeg)
          : coordinates[completedIndex];
      const VehicleIcon = vehicle.Icon;
      const icon = L.divIcon({
        className: "vehicle-marker-wrapper",
        html: `<span class="vehicle-marker vehicle-marker--${vehicle.kind}" aria-hidden="true">${renderToStaticMarkup(<VehicleIcon />)}</span>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      const popup = document.createElement("strong");
      popup.textContent = `${vehicle.label} · ${activeAssetName}`;
      L.marker(position, { icon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(popup, { closeButton: false });
    }

    map.fitBounds(L.latLngBounds(coordinates), {
      padding: [42, 42],
      maxZoom: 12,
    });
    const timer = window.setTimeout(() => map.invalidateSize(), 100);
    return () => {
      window.clearTimeout(timer);
      map.remove();
    };
  }, [
    pointsKey,
    roadData,
    stage,
    completedIndex,
    activeAssetName,
    interactive,
    onTileFallback,
  ]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      role="region"
      aria-label="Peta perjalanan paket"
    />
  );
}

export function LeafletRouteMap({ route, segments = [], stage, lastEventAt }) {
  const dialogRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [tileFallback, setTileFallback] = useState(false);
  const [road, setRoad] = useState({ key: "", data: null, error: "" });
  const roadKey = route.points
    .map((point) => `${point.longitude},${point.latitude}`)
    .join(";");
  const pointsKey = JSON.stringify(route.points);
  const loadingRoad = route.points.length > 1 && road.key !== roadKey;
  const roadData = road.key === roadKey ? road.data : null;
  const roadError = road.key === roadKey ? road.error : "";
  const completedIndex =
    stage === "DELIVERED"
      ? route.points.length - 1
      : Math.min(route.completedIndex, route.points.length - 1);
  const activeAssetName =
    segments.find((segment) => segment.state === "active")?.asset ??
    segments.at(-1)?.asset ??
    "Armada pengiriman";

  useEffect(() => {
    if (!roadKey.includes(";")) return;
    const points = roadKey.split(";").map((waypoint) => {
      const [longitude, latitude] = waypoint.split(",").map(Number);
      return { longitude, latitude };
    });
    const controller = new AbortController();
    let stopped = false;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 12000);
    getRoadRoute(points, controller.signal)
      .then((data) => {
        if (!stopped) setRoad({ key: roadKey, data, error: "" });
      })
      .catch((error) => {
        if (stopped) return;
        setRoad({
          key: roadKey,
          data: null,
          error: timedOut
            ? "Jalur jalan belum tersedia saat ini."
            : error.message,
        });
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      stopped = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [roadKey]);

  const openMap = () => {
    setExpanded(true);
    dialogRef.current?.showModal();
  };

  if (!route.points.length) {
    return (
      <p className="rounded-card bg-ink-50 p-5 text-sm text-ink-600">
        Peta perjalanan belum tersedia.
      </p>
    );
  }

  if (tileFallback) {
    return (
      <>
        <p
          role="status"
          className="mb-3 rounded-card bg-warning-100 p-3 text-sm text-warning-800"
        >
          Peta interaktif tidak dapat dimuat. Skema titik singgah tetap
          tersedia.
        </p>
        <RouteMap route={route} stage={stage} lastEventAt={lastEventAt} />
      </>
    );
  }

  return (
    <div>
      {loadingRoad && (
        <p role="status" className="mb-3 text-sm text-ink-600">
          Memuat peta perjalanan…
        </p>
      )}
      {roadError && (
        <p
          role="status"
          className="mb-3 rounded-card bg-warning-100 p-3 text-sm text-warning-800"
        >
          Rute jalan belum tersedia. Lokasi perjalanan tetap dapat dilihat.
        </p>
      )}
      {!loadingRoad && (
        <div className="relative h-80 w-full overflow-hidden rounded-card border border-ink-200 sm:h-[28rem]">
          <MapCanvas
            pointsKey={pointsKey}
            roadData={roadData}
            stage={stage}
            completedIndex={completedIndex}
            activeAssetName={activeAssetName}
            interactive={false}
            onTileFallback={setTileFallback}
          />
          <button
            type="button"
            onClick={openMap}
            className="absolute inset-0 z-[500] flex items-end justify-end p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-500"
            aria-label="Perbesar peta perjalanan"
          >
            <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-950 shadow-card-raised">
              <FiMaximize2 aria-hidden="true" className="size-4" /> Perbesar
              peta
            </span>
          </button>
        </div>
      )}
      {roadData && (
        <div
          className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-600"
          aria-label="Keterangan jalur peta"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-1 w-6 rounded-full bg-brand-500"
              aria-hidden="true"
            />
            Sudah dilalui
          </span>
          {stage !== "DELIVERED" &&
            ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(stage) && (
              <span className="flex items-center gap-2">
                <span
                  className="w-6 border-t-[3px] border-dashed border-brand-500"
                  aria-hidden="true"
                />
                Sedang ditempuh
              </span>
            )}
          {stage !== "DELIVERED" && (
            <span className="flex items-center gap-2">
              <span
                className="w-6 border-t-[3px] border-dotted border-ink-300"
                aria-hidden="true"
              />
              Berikutnya
            </span>
          )}
        </div>
      )}
      <dialog
        ref={dialogRef}
        aria-label="Peta perjalanan diperbesar"
        onClose={() => setExpanded(false)}
        className="m-auto h-[min(90dvh,55rem)] w-[min(96vw,80rem)] overflow-hidden rounded-card-lg border border-ink-200 bg-white p-0 shadow-card-raised backdrop:bg-ink-950/75"
      >
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-ink-200 px-4 py-3 sm:px-5">
            <h3 className="font-extrabold">Peta perjalanan</h3>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-100 p-0 leading-none hover:bg-ink-200 focus-visible:outline-2 focus-visible:outline-brand-500"
              aria-label="Tutup peta"
            >
              <FiX aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            {expanded && (
              <MapCanvas
                pointsKey={pointsKey}
                roadData={roadData}
                stage={stage}
                completedIndex={completedIndex}
                activeAssetName={activeAssetName}
                interactive
                onTileFallback={setTileFallback}
              />
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
