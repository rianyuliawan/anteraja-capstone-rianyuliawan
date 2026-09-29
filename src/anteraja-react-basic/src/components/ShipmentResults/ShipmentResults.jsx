import Panel from "../ui/Panel";
import ShipmentCard from "../ShipmentCard";

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
          <ShipmentCard
            key={shipment.awb}
            shipment={shipment}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
