import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatDateTime } from "../../utils/format";
import RouteMap from "../RouteMap";

export function LeafletRouteMap({ route, stage, lastEventAt }) {
  const containerRef = useRef(null);
  const [fallback, setFallback] = useState(false);
  const completedIndex =
    stage === "DELIVERED"
      ? route.points.length - 1
      : Math.min(route.completedIndex, route.points.length - 1);
  const progress = Math.round(
    (completedIndex / Math.max(route.points.length - 1, 1)) * 100,
  );
  useEffect(() => {
    if (fallback || !containerRef.current || !route.points.length) return;
    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });
    const coordinates = route.points.map((point) =>
      L.latLng(point.latitude, point.longitude),
    );
    const lastIndex =
      stage === "DELIVERED"
        ? coordinates.length - 1
        : Math.min(route.completedIndex, coordinates.length - 1);
    const isMoving = stage === "IN_TRANSIT" || stage === "OUT_FOR_DELIVERY";
    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    );
    tiles.on("tileerror", () => setFallback(true));
    tiles.addTo(map);
    if (lastIndex > 0)
      L.polyline(coordinates.slice(0, lastIndex + 1), {
        color: "#ed0677",
        weight: 5,
      }).addTo(map);
    if (lastIndex < coordinates.length - 1) {
      if (isMoving)
        L.polyline(coordinates.slice(lastIndex, lastIndex + 2), {
          color: "#ed0677",
          weight: 5,
          dashArray: "7 9",
        }).addTo(map);
      L.polyline(
        coordinates.slice(Math.min(lastIndex + 1, coordinates.length - 1)),
        { color: "#94a3b8", weight: 4, dashArray: "7 9" },
      ).addTo(map);
    }
    route.points.forEach((point, index) => {
      const marker = document.createElement("span");
      marker.className = `route-marker ${index <= lastIndex ? "route-marker--reached" : ""}`;
      marker.textContent = String(index + 1);
      const icon = L.divIcon({
        className: "route-marker-wrapper",
        html: marker,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const popup = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = point.label;
      const detail = document.createElement("p");
      detail.textContent =
        index <= lastIndex
          ? "Titik perjalanan tercatat"
          : "Titik berikutnya / belum dilalui";
      popup.append(title, detail);
      L.marker(coordinates[index], { icon }).addTo(map).bindPopup(popup);
    });
    map.fitBounds(L.latLngBounds(coordinates), {
      padding: [40, 40],
      maxZoom: 12,
    });
    const timer = window.setTimeout(() => map.invalidateSize(), 100);
    return () => {
      window.clearTimeout(timer);
      map.remove();
    };
  }, [route, stage, fallback]);
  if (fallback)
    return (
      <>
        <p
          role="status"
          className="mb-3 rounded-card bg-warning-100 p-3 text-sm text-warning-800"
        >
          Peta interaktif tidak dapat dimuat. Rute ilustratif tetap tersedia.
        </p>
        <RouteMap route={route} stage={stage} lastEventAt={lastEventAt} />
      </>
    );
  return (
    <div>
      <div className="mb-4 grid gap-3 rounded-card bg-cold-100/40 p-4 text-sm sm:grid-cols-3">
        <div>
          <span className="block text-xs text-ink-600">Titik tercatat</span>
          <strong>
            {completedIndex + 1} dari {route.points.length} · {progress}%
          </strong>
        </div>
        <div>
          <span className="block text-xs text-ink-600">
            {stage === "DELIVERED" ? "Tujuan akhir" : "Titik terakhir"}
          </span>
          <strong>
            {route.points[completedIndex]?.label ?? "Belum tersedia"}
          </strong>
        </div>
        <div>
          <span className="block text-xs text-ink-600">Pembaruan terakhir</span>
          <strong>
            <time dateTime={lastEventAt}>{formatDateTime(lastEventAt)}</time>
          </strong>
        </div>
      </div>
      <div
        ref={containerRef}
        className="h-80 w-full overflow-hidden rounded-card border border-ink-200 sm:h-96"
        role="img"
        aria-label="Peta titik singgah paket"
      />
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-600">
        <span>
          <i className="mr-1 inline-block size-2 rounded-full bg-brand-500" />
          Tercatat
        </span>
        <span>
          <i className="mr-1 inline-block size-2 rounded-full bg-ink-300" />
          Belum dilalui
        </span>
      </div>
    </div>
  );
}
