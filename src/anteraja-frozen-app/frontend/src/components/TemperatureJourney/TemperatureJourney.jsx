import { useEffect, useState } from "react";
import { getTemperatureReadings } from "../../api/shipments";
import { formatDateTime, formatTemperature } from "../../utils/format";
import Panel from "../ui/Panel";
import StatusBadge from "../ui/StatusBadge";

const statusText = {
  normal: "Normal",
  warning: "Perlu perhatian",
  critical: "Kritis",
  stale: "Data lama",
  pending: "Menunggu data",
};

const statusTone = {
  normal: "success",
  warning: "warning",
  critical: "danger",
  stale: "neutral",
  pending: "neutral",
};

export function TemperatureJourney({ awb, segments, analysis }) {
  const [open, setOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const [request, setRequest] = useState({ key: "", readings: [], error: "" });
  const key = JSON.stringify([awb, analysis?.readingCount, retry]);
  const isLoading = open && request.key !== key;
  const history = isLoading ? [] : request.readings;

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    getTemperatureReadings(awb, controller.signal)
      .then((data) => setRequest({
        key,
        readings: data.readings,
        error: "",
      }))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setRequest({ key, readings: [], error: error.message });
        }
      });
    return () => controller.abort();
  }, [awb, key, open]);

  return (
    <Panel
      aria-labelledby="temperature-history-title"
      id="temperature-history"
      className="min-w-0"
    >
      <div className="mb-5 border-b border-ink-200 pb-4">
        <h2 id="temperature-history-title" className="text-lg font-extrabold">
          Ringkasan suhu perjalanan
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Pembacaan suhu yang tercatat pada aset selama perjalanan paket.
        </p>
      </div>
      <div
        className={`grid gap-3 sm:grid-cols-2 ${segments.length === 4 ? "xl:grid-cols-2" : "xl:grid-cols-3"}`}
      >
        {segments.map((segment, index) => (
          <article
            key={segment.id}
            className={`flex min-w-0 flex-col rounded-card border p-4 ${segment.state === "active" ? "border-brand-100 bg-brand-50/60" : "border-ink-200 bg-ink-50"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-extrabold">
              <span className="text-ink-500">SEGMEN {index + 1}</span>
              <span
                className={`whitespace-nowrap ${
                  segment.state === "active"
                    ? "text-brand-700"
                    : "text-success-700"
                }`}
              >
                {segment.state === "active" ? "AKTIF" : "SELESAI"}
              </span>
            </div>
            <h3 className="mt-3 text-sm leading-snug font-extrabold break-words">
              {segment.asset}
            </h3>
            <p className="mt-1 text-xs leading-5 text-ink-600">
              {segment.description}
            </p>
            <dl className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 border-t border-ink-200 pt-3">
              <dt className="text-xs leading-4 text-ink-500">
                {segment.valueC == null
                  ? "Belum ada pembacaan"
                  : segment.state === "active"
                    ? "Terbaru"
                    : "Pembacaan akhir"}
              </dt>
              <dd className="font-mono text-base font-bold whitespace-nowrap text-cold-700 tabular-nums">
                {segment.valueC == null
                  ? "—"
                  : formatTemperature(segment.valueC)}
              </dd>
            </dl>
          </article>
        ))}
      </div>
      {analysis && (
        <section
          aria-label="Analisis suhu sepanjang perjalanan"
          className="mt-5 rounded-card bg-ink-50 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold">Analisis suhu</h3>
            <StatusBadge
              tone={
                analysis.criticalCount > 0
                  ? "danger"
                  : analysis.warningCount > 0
                    ? "warning"
                    : analysis.readingCount > 0
                      ? "success"
                      : "neutral"
              }
            >
              {analysis.criticalCount > 0
                ? `${analysis.criticalCount} kritis`
                : analysis.warningCount > 0
                  ? `${analysis.warningCount} perlu perhatian`
                  : analysis.readingCount > 0
                    ? "Tidak ada penyimpangan"
                    : "Belum ada data"}
            </StatusBadge>
          </div>
          {analysis.readingCount > 0 && (
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[
                ["Pembacaan", analysis.readingCount],
                ["Terendah", formatTemperature(analysis.minimumC)],
                ["Rata-rata", formatTemperature(analysis.averageC)],
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
          )}
          {analysis.warningCount > 0 && analysis.criticalCount > 0 && (
            <p className="mt-3 text-xs text-ink-600">
              Termasuk {analysis.warningCount} pembacaan perlu perhatian.
            </p>
          )}
        </section>
      )}
      <details
        onToggle={(event) => setOpen(event.currentTarget.open)}
        className="mt-5 min-w-0 overflow-hidden rounded-card border border-ink-200 bg-white open:pb-2"
      >
        <summary className="cursor-pointer rounded-card px-4 py-3 text-sm font-bold text-brand-700 hover:bg-brand-50">
          Lihat riwayat suhu ({analysis?.readingCount ?? 0} pembacaan)
        </summary>
        {isLoading && (
          <p role="status" className="px-4 pb-3 text-sm text-ink-600">
            Memuat riwayat suhu…
          </p>
        )}
        {!isLoading && request.error && (
          <p
            role="alert"
            className="mx-4 mb-3 rounded-card bg-danger-100 p-3 text-sm text-danger-700"
          >
            {request.error}{" "}
            <button
              type="button"
              onClick={() => setRetry((current) => current + 1)}
              className="font-bold underline"
            >
              Coba lagi
            </button>
          </p>
        )}
        {!isLoading && !request.error && (
          <div
            role="region"
            aria-label="Riwayat suhu"
            className="max-w-full overflow-x-auto px-4 pb-2"
          >
            {history.length > 0 ? (
              <table className="w-full min-w-[28rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink-300 text-left text-xs font-bold text-ink-600">
                    <th className="py-2 pr-3">Waktu Pembacaan</th>
                    <th className="py-2 pr-3">Aset</th>
                    <th className="py-2 pr-3 text-right">Suhu</th>
                    <th className="py-2">Kondisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 pr-3 whitespace-nowrap text-ink-600">
                        <time dateTime={item.observedAt}>
                          {formatDateTime(item.observedAt)}
                        </time>
                      </td>
                      <td className="py-2 pr-3 font-semibold whitespace-nowrap">
                        {item.asset}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono font-bold whitespace-nowrap text-cold-700 tabular-nums">
                        {formatTemperature(item.valueC)}
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        <StatusBadge tone={statusTone[item.state]}>
                          {statusText[item.state]}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-5 text-center text-ink-500">
                Belum ada pembacaan suhu.
              </p>
            )}
          </div>
        )}
      </details>
    </Panel>
  );
}
