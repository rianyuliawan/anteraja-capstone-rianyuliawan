import { formatDateTime, formatTemperature } from "../../utils/format";
import Panel from "../ui/Panel";

export function TemperatureCard({ reading, stage }) {
  const delivered = stage === "DELIVERED";
  const hasReading =
    Number.isFinite(reading.valueC) && Boolean(reading.observedAt);
  const hasRange =
    Number.isFinite(reading.normalLowC) &&
    Number.isFinite(reading.normalHighC);
  const outsideRange =
    hasReading &&
    hasRange &&
    (reading.valueC < reading.normalLowC ||
      reading.valueC > reading.normalHighC);
  return (
    <Panel aria-labelledby="temperature-title">
      <h2 id="temperature-title" className="mb-4 text-lg font-extrabold">
        {delivered ? "Pembacaan suhu akhir" : "Pembacaan suhu aset"}
      </h2>
      <div className="rounded-card bg-cold-100/40 p-4 text-cold-700">
        <p className="text-xs font-extrabold tracking-wide uppercase">
          {reading.asset}
        </p>
        <p className="mt-1 text-xs">Kode aset: {reading.assetCode}</p>
        <p className="mt-3 font-mono text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
          {hasReading ? formatTemperature(reading.valueC) : "—"}
        </p>
        {hasRange && (
          <p className="mt-2 text-xs">
            {reading.basisType === "PUBLIC_CLAIM"
              ? "Acuan freezer dari artikel Anteraja: "
              : "Rentang pemantauan aset: "}
            {formatTemperature(reading.normalLowC)} s.d.{" "}
            {formatTemperature(reading.normalHighC)}
          </p>
        )}
      </div>
      {outsideRange && (
        <p
          role="status"
          className="mt-3 rounded-card border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700"
        >
          Pembacaan suhu aset berada di luar rentang pemantauan.{" "}
          {delivered
            ? "Riwayat suhu tetap tersedia untuk ditinjau."
            : "Aset perlu diperiksa oleh tim operasional."}
        </p>
      )}
      <p className="mt-3 text-xs text-ink-600">
        {reading.basisType === "PUBLIC_CLAIM" && reading.sourceUrl && (
          <>
            {" "}Lihat{" "}
            <a
              className="font-semibold text-brand-700 underline"
              href={reading.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              sumber acuan
            </a>
            .
          </>
        )}
      </p>
      {hasReading ? (
        <p className="mt-4 text-xs text-ink-600">
          Pembacaan terakhir:{" "}
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
    </Panel>
  );
}
