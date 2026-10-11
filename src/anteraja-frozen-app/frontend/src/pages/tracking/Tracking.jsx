import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import ShipmentSummary from "../../components/ShipmentSummary";
import TemperatureCard from "../../components/TemperatureCard";
import EvidenceGallery from "../../components/EvidenceGallery";
import JourneyPanel from "../../components/JourneyPanel";
import { getShipment } from "../../api/shipments";

const REFRESH_INTERVAL_MS = 30_000;

function TrackingLoading() {
  return (
    <section role="status" className="min-h-[calc(100svh-8rem)]">
      <p className="mb-5 text-sm font-semibold text-ink-600">
        Memuat detail pengiriman…
      </p>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="rounded-card border border-ink-200 bg-white p-6">
          <div className="h-4 w-32 rounded bg-ink-100" />
          <div className="mt-3 h-7 w-52 max-w-full rounded bg-ink-100" />
          <div className="mt-7 border-t border-ink-200 pt-5">
            <div className="h-4 w-28 rounded bg-ink-100" />
            <div className="mt-2 h-6 w-44 rounded bg-ink-100" />
          </div>
          <div className="mt-6 h-24 rounded-card bg-ink-50" />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(18rem,0.38fr)_minmax(0,0.62fr)]">
          <div className="h-64 rounded-card border border-ink-200 bg-white" />
          <div className="h-80 rounded-card border border-ink-200 bg-white" />
        </div>
      </div>
    </section>
  );
}

export function Tracking() {
  const { awb = "" } = useParams();
  const { showToast, searchedAwbs } = useOutletContext();
  const selectedAwb = awb.toUpperCase();
  const [request, setRequest] = useState({
    awb: "",
    shipment: null,
    error: "",
  });
  const [refreshError, setRefreshError] = useState(false);
  const isLoading = request.awb !== selectedAwb;
  const shipment = isLoading ? null : request.shipment;
  const error = isLoading ? "" : request.error;
  useEffect(() => {
    let controller = null;
    let stopped = false;
    let delivered = false;

    async function refreshShipment() {
      if (
        stopped ||
        controller ||
        document.visibilityState !== "visible" ||
        delivered
      )
        return;

      controller = new AbortController();
      try {
        const data = await getShipment(selectedAwb, controller.signal);
        if (stopped) return;
        delivered = data.stage === "DELIVERED";
        setRequest({ awb: selectedAwb, shipment: data, error: "" });
        setRefreshError(false);
      } catch (cause) {
        if (stopped || cause.name === "AbortError") return;
        setRequest((current) =>
          current.awb === selectedAwb && current.shipment
            ? current
            : { awb: selectedAwb, shipment: null, error: cause.message },
        );
        setRefreshError(true);
      } finally {
        controller = null;
      }
    }

    refreshShipment();
    const timer = window.setInterval(refreshShipment, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshShipment);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshShipment);
      controller?.abort();
    };
  }, [selectedAwb]);

  const resultAwbs = searchedAwbs.length ? searchedAwbs : [awb.toUpperCase()];
  if (isLoading) return <TrackingLoading />;
  if (error && error !== "Paket tidak ditemukan.")
    return (
      <p
        role="alert"
        className="rounded-card bg-danger-100 p-8 text-danger-700"
      >
        {error}
      </p>
    );
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
  const delivered = shipment.stage === "DELIVERED";
  const evidenceGallery = (
    <EvidenceGallery
      key={`evidence-${shipment.awb}`}
      awb={shipment.awb}
      pickup={shipment.pickup}
      delivery={shipment.delivery}
    />
  );
  return (
    <div id="hasil" className="scroll-mt-24">
      {refreshError && (
        <p
          role="status"
          className="mb-4 rounded-card bg-warning-100 p-3 text-sm text-warning-800"
        >
          Pembaruan otomatis tertunda. Data terakhir yang berhasil dimuat tetap
          ditampilkan.
        </p>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={searchedAwbs.length ? "/results" : "/"}
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
      <ShipmentSummary shipment={shipment} onNotify={showToast} />
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(18rem,0.38fr)_minmax(0,0.62fr)]">
        <aside
          className="grid content-start gap-5"
          aria-label="Suhu dan dokumentasi paket"
        >
          <TemperatureCard
            reading={shipment.temperature}
            stage={shipment.stage}
            analysis={shipment.temperatureAnalysis}
          />
          {delivered && evidenceGallery}
        </aside>
        <div className="grid min-w-0 content-start gap-5">
          <JourneyPanel key={shipment.awb} shipment={shipment} />
          {!delivered && evidenceGallery}
        </div>
      </div>
    </div>
  );
}
