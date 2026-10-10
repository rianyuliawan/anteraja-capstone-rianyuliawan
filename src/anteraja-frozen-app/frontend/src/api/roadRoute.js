const ROUTING_BASE_URL =
  import.meta.env.VITE_ROUTING_BASE_URL || "https://router.project-osrm.org";

export async function getRoadRoute(points, signal) {
  const waypoints = points
    .map((point) => `${point.longitude},${point.latitude}`)
    .join(";");
  const url = `${ROUTING_BASE_URL}/route/v1/driving/${waypoints}?overview=false&steps=true&geometries=geojson`;
  const response = await fetch(url, { signal });

  if (!response.ok) throw new Error("Layanan rute jalan tidak merespons.");

  const data = await response.json();
  const route = data.routes?.[0];
  if (data.code !== "Ok" || route?.legs?.length !== points.length - 1) {
    throw new Error("Jalur jalan untuk titik singgah ini belum tersedia.");
  }

  const legs = route.legs.map((leg) =>
    leg.steps.flatMap((step) =>
      (step.geometry?.coordinates || []).map(([longitude, latitude]) => [
        latitude,
        longitude,
      ]),
    ),
  );
  if (legs.some((leg) => leg.length < 2)) {
    throw new Error("Geometri jalur jalan tidak lengkap.");
  }

  return { legs, distanceKm: route.distance / 1000 };
}
