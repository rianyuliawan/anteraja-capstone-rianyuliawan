import { formatDateTime } from "../../utils/format";
import Button from "../ui/Button";
import Panel from "../ui/Panel";
import StatusBadge from "../ui/StatusBadge";

export function ShipmentCard({ shipment, onSelect }) {
  return (
    <Panel
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
  );
}
