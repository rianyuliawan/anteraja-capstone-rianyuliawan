import { formatDateTime } from "../../utils/format";
import Panel from "../ui/Panel";
import StatusBadge from "../ui/StatusBadge";

export function ShipmentSummary({ shipment, onNotify }) {
  const copyAwb = async () => {
    try {
      await navigator.clipboard.writeText(shipment.awb);
      onNotify("AWB disalin.");
    } catch {
      onNotify("AWB belum dapat disalin.", "error");
    }
  };
  return (
    <Panel as="article" aria-labelledby="shipment-summary-title">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-200 pb-4">
        <div>
          <p className="text-xs font-extrabold tracking-wider text-ink-500 uppercase">
            Nomor resi / AWB
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h1
              id="shipment-summary-title"
              className="text-xl font-extrabold tracking-wide break-all"
            >
              {shipment.awb}
            </h1>
            <button
              type="button"
              onClick={copyAwb}
              className="rounded-full border border-ink-200 px-2.5 py-1 text-xs font-bold text-brand-700 hover:border-brand-500"
              aria-label={`Salin nomor resi ${shipment.awb}`}
            >
              Salin
            </button>
          </div>
        </div>
        <StatusBadge tone={shipment.stage === "DELIVERED" ? "success" : "info"}>
          {shipment.status}
        </StatusBadge>
      </div>

      <dl className="mt-4 grid gap-4 rounded-card bg-ink-50 p-4">
        <div>
          <dt className="text-xs font-extrabold tracking-wide text-ink-500 uppercase">
            Asal pengiriman
          </dt>
          <dd className="mt-1 text-sm font-bold text-ink-950">
            {shipment.origin}
          </dd>
        </div>
        <div className="border-t border-ink-200 pt-4">
          <dt className="text-xs font-extrabold tracking-wide text-ink-500 uppercase">
            Tujuan pengiriman
          </dt>
          <dd className="mt-1 text-sm font-bold text-ink-950">
            {shipment.destination}
          </dd>
        </div>
      </dl>

      <dl className="mt-4 grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink-500">Pengirim</dt>
          <dd className="font-semibold">{shipment.sender}</dd>
        </div>
        <div>
          <dt className="text-ink-500">Penerima</dt>
          <dd className="font-semibold">{shipment.recipient}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-ink-500">Kejadian terakhir</dt>
          <dd className="font-semibold">
            <time dateTime={shipment.lastEventAt}>
              {formatDateTime(shipment.lastEventAt)}
            </time>
          </dd>
        </div>
      </dl>
    </Panel>
  );
}
