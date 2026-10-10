export function RouteMap({ route, stage }) {
  const points = route.points;
  if (!points.length)
    return (
      <p className="rounded-card bg-ink-50 p-6 text-sm text-ink-600">
        Rute perjalanan belum tersedia.
      </p>
    );
  const longitudes = points.map((point) => point.longitude);
  const latitudes = points.map((point) => point.latitude);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const width = Math.max(maxLng - minLng, 0.001);
  const height = Math.max(maxLat - minLat, 0.001);
  const coordinates = points.map((point) => ({
    ...point,
    x: 84 + ((point.longitude - minLng) / width) * 590,
    y: 66 + ((maxLat - point.latitude) / height) * 185,
  }));
  const delivered = stage === "DELIVERED";
  const completedIndex = delivered
    ? points.length - 1
    : Math.min(route.completedIndex, points.length - 1);
  const progress = Math.round(
    (completedIndex / Math.max(points.length - 1, 1)) * 100,
  );
  const path = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const completedPath = coordinates
    .slice(0, completedIndex + 1)
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const moving = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(
    stage,
  );
  const activePath =
    moving && completedIndex < coordinates.length - 1
      ? coordinates
          .slice(completedIndex, completedIndex + 2)
          .map((point) => `${point.x},${point.y}`)
          .join(" ")
      : "";
  return (
    <div>
      <div className="overflow-hidden rounded-card border border-ink-200 bg-ink-50">
        <svg
          viewBox="0 0 760 320"
          role="img"
          aria-label={`Skema perjalanan dari ${points[0].label} ke ${points.at(-1)?.label}; ${progress} persen titik telah dilalui`}
          className="h-auto min-h-64 w-full"
        >
          <defs>
            <pattern
              id="route-grid"
              width="58"
              height="58"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 58 0 L 0 0 0 58"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="760" height="320" fill="#f8fafc" />
          <rect width="760" height="320" fill="url(#route-grid)" />
          <path
            d="M0 285 C160 210 260 302 430 240 S640 280 760 185"
            fill="none"
            stroke="#dff5f8"
            strokeWidth="25"
          />
          <polyline
            points={path}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="10 12"
          />
          {completedIndex > 0 && (
            <polyline
              points={completedPath}
              fill="none"
              stroke="#ed0677"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {activePath && (
            <polyline
              points={activePath}
              fill="none"
              stroke="#ed0677"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="10 10"
            />
          )}
          {coordinates.map((point, index) => {
            const reached = index <= completedIndex;
            const current = index === completedIndex && !delivered;
            return (
              <g key={point.id}>
                {current && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="22"
                    fill="none"
                    stroke="#fce7f3"
                    strokeWidth="5"
                  />
                )}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="17"
                  fill={reached ? "#ed0677" : "#fff"}
                  stroke={reached ? "#fff" : "#94a3b8"}
                  strokeWidth="4"
                />
                <text
                  x={point.x}
                  y={point.y + 5}
                  textAnchor="middle"
                  fill={reached ? "#fff" : "#475569"}
                  fontSize="13"
                  fontWeight="800"
                >
                  {index + 1}
                </text>
                <text
                  x={point.x}
                  y={point.y < 110 ? point.y + 38 : point.y - 28}
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize="12"
                  fontWeight="700"
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
