import { formatDateTime, formatTemperature } from "../../utils/format";
import Panel from "../ui/Panel";
import StatusBadge from "../ui/StatusBadge";

const stateLabels = {
  normal: "Normal",
  warning: "Perlu perhatian",
  critical: "Kritis",
  stale: "Data belum diperbarui",
  pending: "Menunggu pembacaan",
};
const stateTones = {
  normal: "success",
  warning: "warning",
  critical: "danger",
  stale: "neutral",
  pending: "neutral",
};
const readingStyles = {
  normal: "bg-cold-100/40 text-cold-700",
  warning: "bg-warning-100 text-warning-800",
  critical: "bg-danger-100 text-danger-700",
  stale: "bg-ink-100 text-ink-700",
  pending: "bg-ink-100 text-ink-700",
};
export function TemperatureCard({ reading, stage, now }) {
  const delivered = stage === "DELIVERED";
  const hasReading =
    Number.isFinite(reading.valueC) && Boolean(reading.observedAt);
  const stale =
    hasReading &&
    !delivered &&
    now - new Date(reading.observedAt).getTime() > 60 * 60_000;
  const displayState = !hasReading
    ? "pending"
    : stale && reading.state === "normal"
      ? "stale"
      : reading.state;
  return (
    <Panel aria-labelledby="temperature-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="temperature-title" className="text-lg font-extrabold">
          {delivered ? "Pembacaan suhu akhir" : "Pembacaan suhu aset"}
        </h2>
        <StatusBadge
          tone={delivered && hasReading ? "success" : stateTones[displayState]}
        >
          {delivered && hasReading ? "Selesai" : stateLabels[displayState]}
        </StatusBadge>
      </div>
      <div className={`rounded-card p-4 ${readingStyles[displayState]}`}>
        <p className="text-xs font-extrabold tracking-wide uppercase">
          {reading.asset}
        </p>
        <p className="mt-1 text-xs">Kode aset: {reading.assetCode}</p>
        <p className="mt-3 font-mono text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
          {hasReading ? formatTemperature(reading.valueC) : "—"}
        </p>
        <p className="mt-1 text-xs">
          Rentang normal aset: {formatTemperature(reading.normalLowC)} s.d.{" "}
          {formatTemperature(reading.normalHighC)}
        </p>
      </div>
      {hasReading ? (
        <p className="mt-4 text-xs text-ink-600">
          Pembacaan terakhir: {" "}
          <time dateTime={reading.observedAt}>
            {formatDateTime(reading.observedAt)}
          </time>
        </p>
      ) : (
        <p className="mt-4 text-xs text-ink-600">
          Belum ada pembacaan sejak paket masuk ke aset ini.
        </p>
      )}
      {!hasReading && (
        <p
          role="status"
          className="mt-3 rounded-card bg-ink-50 p-3 text-sm text-ink-700"
        >
          Riwayat suhu dari aset sebelumnya tetap tersedia di bawah. Nilainya
          tidak digunakan sebagai suhu aset saat ini.
        </p>
      )}
      {stale && (
        <p
          role="status"
          className="mt-3 rounded-card bg-warning-100 p-3 text-sm text-warning-800"
        >
          Pembacaan suhu belum diperbarui. Nilai di atas adalah pembacaan
          terakhir yang tersedia, bukan kondisi saat ini.
        </p>
      )}
      {hasReading && reading.state === "warning" && (
        <p
          role="alert"
          className="mt-3 rounded-card bg-warning-100 p-3 text-sm text-warning-800"
        >
          Suhu lingkungan aset berada di luar rentang normal. Penanganan perlu
          diperiksa.
        </p>
      )}
      {hasReading && reading.state === "critical" && (
        <p
          role="alert"
          className="mt-3 rounded-card bg-danger-100 p-3 text-sm font-semibold text-danger-700"
        >
          Deviasi suhu kritis terdeteksi. Hubungi Customer Care untuk bantuan
          lebih lanjut.
        </p>
      )}
      <div className="mt-4 rounded-card bg-ink-50 p-3 text-sm text-ink-700">
        {delivered ? (
          <>
            <strong>Pemantauan suhu telah selesai.</strong> Data terakhir
            dikunci setelah paket diterima.
          </>
        ) : (
          <>
            <strong>Suhu aset diperbarui secara berkala.</strong>{" "}
            {hasReading
              ? "Waktu pembacaan terakhir tercantum di atas."
              : "Pembacaan aset ini belum tersedia."}
          </>
        )}
      </div>
      <p className="mt-4 text-xs leading-5 text-ink-500">
        Suhu yang ditampilkan merupakan suhu lingkungan aset penyimpanan atau
        armada, bukan suhu inti produk.
      </p>
    </Panel>
  );
}
