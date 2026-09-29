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

export function TemperatureJourney({ segments, history }) {
  return (
    <Panel aria-labelledby="temperature-history-title" id="temperature-history">
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
      <details className="mt-5 rounded-card border border-ink-200 bg-white open:pb-2">
        <summary className="cursor-pointer rounded-card px-4 py-3 text-sm font-bold text-brand-700 hover:bg-brand-50">
          Lihat riwayat suhu ({history.length} pembacaan)
        </summary>
        <ol className="divide-y divide-ink-200 px-4">
          {history.map((item) => (
            <li
              key={item.id}
              className="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(9rem,1fr)_minmax(8rem,1fr)_auto_auto] sm:items-center"
            >
              <time dateTime={item.observedAt} className="text-ink-600">
                {formatDateTime(item.observedAt)}
              </time>
              <span className="font-semibold">{item.asset}</span>
              <strong className="font-mono text-cold-700 tabular-nums">
                {formatTemperature(item.valueC)}
              </strong>
              <StatusBadge tone={statusTone[item.state]}>
                {statusText[item.state]}
              </StatusBadge>
            </li>
          ))}
        </ol>
      </details>
    </Panel>
  );
}
