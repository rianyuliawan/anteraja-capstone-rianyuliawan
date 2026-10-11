import { formatDateTime } from "../../utils/format";
import { FiArrowRight, FiCopy } from "react-icons/fi";
import { PiSealCheckDuotone, PiTruckDuotone } from "react-icons/pi";
import Panel from "../ui/Panel";

export function ShipmentSummary({ shipment, onNotify }) {
  const copyAwb = async () => {
    try {
      await navigator.clipboard.writeText(shipment.awb);
      onNotify("AWB disalin.");
    } catch {
      onNotify("AWB belum dapat disalin.", "error");
    }
  };
  const delivered = shipment.stage === "DELIVERED";
  return (
    <Panel as="article" aria-labelledby="shipment-summary-title">
      <div className="flex items-start gap-3 border-b border-ink-200 pb-5 sm:gap-4">
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-2xl ${delivered ? "bg-success-100 text-success-700" : "bg-brand-50 text-brand-700"}`}
          aria-hidden="true"
        >
          {delivered ? (
            <PiSealCheckDuotone className="size-7" />
          ) : (
            <PiTruckDuotone className="size-7" viewBox="-16 -16 288 288" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-extrabold tracking-wide text-ink-500 uppercase">
            Status pengiriman
          </p>
          <h1
            id="shipment-summary-title"
            className={`mt-0.5 text-xl font-extrabold leading-tight sm:text-2xl ${delivered ? "text-success-700" : "text-brand-700"}`}
          >
            {shipment.status}
          </h1>
          <p className="mt-1 text-xs text-ink-500">
            Diperbarui{" "}
            <time dateTime={shipment.lastEventAt}>
              {formatDateTime(shipment.lastEventAt)}
            </time>
          </p>
        </div>
      </div>

      <div className="mt-5 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold tracking-wide text-ink-500 uppercase">
            Nomor resi / AWB
          </p>
          <p className="mt-1 break-all text-base font-extrabold tracking-wide sm:text-lg">
            {shipment.awb}
          </p>
        </div>
        <button
          type="button"
          onClick={copyAwb}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-ink-200 text-brand-700 hover:border-brand-500 hover:bg-brand-50"
          aria-label={`Salin nomor resi ${shipment.awb}`}
          title="Salin nomor resi"
        >
          <FiCopy aria-hidden="true" className="size-4" />
        </button>
      </div>

      <dl className="mt-5 grid gap-4 rounded-card bg-ink-50 p-4 sm:grid-cols-2 sm:gap-3 sm:bg-transparent sm:p-0">
        <div className="min-w-0 border-l-2 border-brand-500 pl-3 sm:rounded-card sm:border sm:border-ink-200 sm:bg-ink-50 sm:p-4">
          <dt className="text-xs font-extrabold tracking-wide text-ink-500 uppercase">
            Asal pengiriman
          </dt>
          <dd className="mt-1 break-words text-sm font-bold text-ink-950">
            {shipment.origin}
          </dd>
        </div>
        <div className="relative min-w-0 border-l-2 border-brand-100 pl-3 sm:rounded-card sm:border sm:border-ink-200 sm:bg-ink-50 sm:p-4">
          <span
            className="absolute top-1/2 -left-1.5 z-10 hidden size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-brand-100 bg-white text-brand-700 shadow-sm sm:grid"
            aria-hidden="true"
          >
            <FiArrowRight className="size-5" />
          </span>
          <dt className="text-xs font-extrabold tracking-wide text-ink-500 uppercase">
            Tujuan pengiriman
          </dt>
          <dd className="mt-1 break-words text-sm font-bold text-ink-950">
            {shipment.destination}
          </dd>
        </div>
      </dl>

      <ShipmentMeta
        shipment={shipment}
        className="mt-5 grid gap-x-4 gap-y-3 border-t border-ink-200 pt-4 text-sm sm:grid-cols-2"
      />
    </Panel>
  );
}

function ShipmentMeta({ shipment, className }) {
  return (
    <dl className={className}>
      <div className="min-w-0">
        <dt className="text-ink-500">Pengirim</dt>
        <dd className="break-words font-semibold">{shipment.sender}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-ink-500">Penerima</dt>
        <dd className="break-words font-semibold">{shipment.recipient}</dd>
      </div>
    </dl>
  );
}
