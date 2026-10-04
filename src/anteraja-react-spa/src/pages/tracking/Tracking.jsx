import { Link, useOutletContext, useParams } from "react-router-dom";
import ShipmentSummary from "../../components/ShipmentSummary";
import TemperatureCard from "../../components/TemperatureCard";
import EvidenceGallery from "../../components/EvidenceGallery";
import JourneyPanel from "../../components/JourneyPanel";
import TemperatureJourney from "../../components/TemperatureJourney";
import { useShipmentContext } from "../../context/ShipmentContext";

export function Tracking() {
  const { id = "" } = useParams();
  const { showToast } = useOutletContext();
  const { shipments, now, searchedAwbs } = useShipmentContext();
  const shipment = shipments[id.toUpperCase()];
  const resultAwbs = searchedAwbs.includes(shipment?.awb)
    ? searchedAwbs
    : [id.toUpperCase()];
  if (!shipment)
    return (
      <section className="rounded-card border border-ink-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-extrabold">Nomor resi tidak ditemukan</h1>
        <p className="mt-2 text-sm text-ink-600">
          Periksa kembali nomor AWB yang Anda masukkan.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block font-bold text-brand-700 underline"
        >
          Kembali ke pencarian
        </Link>
      </section>
    );
  return (
    <div id="hasil" className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={searchedAwbs.length ? "/shipments" : "/"}
          className="text-sm font-bold text-brand-700 hover:underline"
        >
          ←{" "}
          {searchedAwbs.length
            ? "Kembali ke daftar hasil"
            : "Kembali ke pencarian"}
        </Link>
        <span className="text-xs text-ink-500">
          {resultAwbs.indexOf(shipment.awb) + 1} dari {resultAwbs.length} resi
        </span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(18rem,0.38fr)_minmax(0,0.62fr)]">
        <aside
          className="grid content-start gap-5"
          aria-label="Informasi utama paket"
        >
          <ShipmentSummary shipment={shipment} onNotify={showToast} />
          <TemperatureCard
            reading={shipment.temperature}
            stage={shipment.stage}
            now={now}
          />
        </aside>
        <div className="grid min-w-0 content-start gap-5">
          <JourneyPanel key={shipment.awb} shipment={shipment} />
          <EvidenceGallery
            awb={shipment.awb}
            pickup={shipment.pickup}
            delivery={shipment.delivery}
          />
          <TemperatureJourney
            segments={shipment.segments}
            history={shipment.history}
          />
        </div>
      </div>
    </div>
  );
}
