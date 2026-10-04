import { formatDateTime } from "../../utils/format";
import Button from "../ui/Button";
import Panel from "../ui/Panel";
import StatusBadge from "../ui/StatusBadge";

export function ShipmentResults({ awbs, shipments, onSelect }) {
  const foundShipments = awbs.map((awb) => shipments[awb]).filter(Boolean);

  return (
    <section
      id="hasil"
      aria-labelledby="results-title"
      className="scroll-mt-24"
    >
      <div className="mb-4">
        <h2 id="results-title" className="text-2xl font-extrabold">
          Status pengiriman
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          Menampilkan {foundShipments.length} dari {awbs.length} resi yang
          dicari.
          {foundShipments.length > 0 &&
            " Pilih satu paket untuk melihat perjalanan dan suhu lebih lengkap."}
        </p>
      </div>
      {foundShipments.length === 0 && (
        <Panel as="article" role="status" className="text-sm text-ink-600">
          Belum ada paket yang dapat ditampilkan. Periksa kembali nomor resi
          Anda.
        </Panel>
      )}
      <div className="grid gap-3">
        {foundShipments.map((shipment) => (
          <Panel
            key={shipment.awb}
            as="article"
            className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-extrabold">{shipment.awb}</h3>
                <StatusBadge
                  tone={shipment.stage === "DELIVERED" ? "success" : "info"}
                >
                  {shipment.status}
                </StatusBadge>
              </div>
              <p className="mt-1 text-sm text-ink-600">
                {shipment.latestDescription}
              </p>
              <p className="mt-2 text-xs text-ink-500">
                Pengirim: {shipment.sender} · Penerima: {shipment.recipient}
              </p>
              <time
                dateTime={shipment.lastEventAt}
                className="mt-1 block text-xs text-ink-500"
              >
                {formatDateTime(shipment.lastEventAt)}
              </time>
            </div>
            <Button variant="secondary" onClick={() => onSelect(shipment.awb)}>
              Lihat Detail
            </Button>
          </Panel>
        ))}
      </div>
    </section>
  );
}
