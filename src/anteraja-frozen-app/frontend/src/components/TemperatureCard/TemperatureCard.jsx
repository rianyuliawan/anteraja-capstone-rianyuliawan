import { formatDateTime, formatTemperature } from "../../utils/format";
import Panel from "../ui/Panel";

export function TemperatureCard({ reading, stage, analysis }) {
  const delivered = stage === "DELIVERED";
  const hasReading =
    Number.isFinite(reading.valueC) && Boolean(reading.observedAt);
  const hasRange =
    Number.isFinite(reading.normalLowC) && Number.isFinite(reading.normalHighC);
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
        <p className="mt-1 hidden text-xs sm:block">
          Kode aset: {reading.assetCode}
        </p>
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
            ? "Tim operasional dapat meninjau hasil pemantauan."
            : "Aset perlu diperiksa oleh tim operasional."}
        </p>
      )}
      {reading.basisType === "PUBLIC_CLAIM" && reading.sourceUrl && (
        <p className="mt-3 text-xs text-ink-600">
          Lihat{" "}
          <a
            className="font-semibold text-brand-700 underline"
            href={reading.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            sumber acuan
          </a>
          .
        </p>
      )}
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
      {analysis && (
        <section
          aria-label="Ringkasan pembacaan suhu"
          className="mt-5 border-t border-ink-200 pt-4"
        >
          <h3 className="text-sm font-extrabold">Ringkasan pembacaan</h3>
          {analysis.readingCount > 0 ? (
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {[
                ["Jumlah", analysis.readingCount],
                ["Rata-rata", formatTemperature(analysis.averageC)],
                ["Terendah", formatTemperature(analysis.minimumC)],
                ["Tertinggi", formatTemperature(analysis.maximumC)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs text-ink-500">{label}</dt>
                  <dd className="mt-1 font-mono font-bold text-cold-700 tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-2 text-sm text-ink-600">
              Belum ada pembacaan suhu untuk perjalanan ini.
            </p>
          )}
        </section>
      )}
    </Panel>
  );
}
