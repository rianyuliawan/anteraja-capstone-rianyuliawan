import { useState } from "react";
import { currentDemoShipments } from "../../data/demoShipments";
import { ShipmentProvider } from "../../context/ShipmentContext";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import SearchHero from "../../components/SearchHero";
import ShipmentResults from "../../components/ShipmentResults";
import ShipmentSummary from "../../components/ShipmentSummary";
import TemperatureCard from "../../components/TemperatureCard";
import JourneyPanel from "../../components/JourneyPanel";
import EvidenceGallery from "../../components/EvidenceGallery";
import TemperatureJourney from "../../components/TemperatureJourney";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import LocationExplorer from "../../components/LocationExplorer";
import PackageGallery from "../../components/PackageGallery";

const features = [
  {
    title: "Status perjalanan",
    icon: "↗",
    description: "Lihat kejadian terbaru dan linimasa perpindahan paket.",
  },
  {
    title: "Peta titik singgah",
    icon: "⌖",
    description:
      "Pahami urutan hub yang tercatat tanpa mengira-ngira posisi GPS langsung.",
  },
  {
    title: "Suhu kompartemen",
    icon: "°",
    description: "Pantau pembacaan suhu lingkungan aset dan riwayatnya.",
  },
];

function HomeContent() {
  return (
    <>
      <section
        aria-labelledby="service-title"
        className="mx-auto mt-8 max-w-5xl border-t border-ink-200 pt-10"
      >
        <div className="text-center">
          <h2 id="service-title" className="text-2xl font-extrabold">
            Informasi yang dapat Anda lihat
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            Seluruh informasi pengiriman tampil setelah nomor resi ditemukan.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-card border border-ink-200 bg-white p-5"
            >
              <span aria-hidden="true" className="text-2xl">
                {feature.icon}
              </span>
              <h3 className="mt-3 font-extrabold">{feature.title}</h3>
              <p className="mt-1 text-sm text-ink-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
      <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-ink-500">
        Suhu yang ditampilkan merupakan suhu lingkungan kompartemen atau armada.
      </p>
      <LocationExplorer />
      <PackageGallery />
    </>
  );
}

function ShipmentDetail({ shipment, onBack, onNotify }) {
  return (
    <div id="hasil" className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          ← Kembali ke daftar hasil
        </Button>
        <span className="text-xs text-ink-500">Detail resi {shipment.awb}</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(18rem,0.38fr)_minmax(0,0.62fr)]">
        <aside
          className="grid content-start gap-5"
          aria-label="Informasi utama paket"
        >
          <ShipmentSummary shipment={shipment} onNotify={onNotify} />
          <TemperatureCard
            reading={shipment.temperature}
            stage={shipment.stage}
            now={Date.now()}
          />
        </aside>
        <div className="grid content-start gap-5">
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

export function TrackingPage() {
  // Data mock disimpan di parent, lalu dikirim ke komponen anak melalui props.
  const [shipments] = useState(currentDemoShipments);
  const [view, setView] = useState("home");
  const [searchedAwbs, setSearchedAwbs] = useState([]);
  const [selectedAwb, setSelectedAwb] = useState("");
  const [toast, setToast] = useState(null);
  const selectedShipment = shipments[selectedAwb];

  const showToast = (message, tone = "success") => {
    const id = Date.now();
    setToast({ id, message, tone });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3000);
  };

  const showResults = (awbs) => {
    setSearchedAwbs(awbs);
    setView("results");
    window.setTimeout(() => {
      document.getElementById("hasil")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    }, 0);
  };

  const showDetail = (awb) => {
    setSelectedAwb(awb);
    setView("detail");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const goHome = () => {
    setView("home");
    setSearchedAwbs([]);
    setSelectedAwb("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-ink-950 focus:px-4 focus:py-2 text-white"
      >
        Lewati ke konten utama
      </a>
      <SiteHeader onHome={goHome} />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-4 py-8 md:px-8"
      >
        {view === "detail" && selectedShipment ? (
          <ShipmentDetail
            shipment={selectedShipment}
            onBack={() => setView("results")}
            onNotify={showToast}
          />
        ) : (
          <>
            <SearchHero
              awbs={view === "results" ? searchedAwbs : []}
              onSearch={showResults}
              onNotify={showToast}
            />
            {view === "results" ? (
              <ShipmentResults
                awbs={searchedAwbs}
                shipments={shipments}
                onSelect={showDetail}
              />
            ) : (
              <ShipmentProvider>
                <HomeContent />
              </ShipmentProvider>
            )}
          </>
        )}
        <section
          id="customer-care"
          className="mt-10 scroll-mt-24 rounded-card-lg border border-brand-100 bg-brand-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-5"
          aria-labelledby="customer-care-title"
        >
          <div>
            <h2 id="customer-care-title" className="font-extrabold">
              Butuh bantuan terkait kiriman Anda?
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Hubungi Customer Care Anteraja melalui saluran resmi.
            </p>
          </div>
          <a
            href="tel:+622150663333"
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-700 sm:mt-0"
          >
            (021) 5066 3333
          </a>
        </section>
      </main>
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      )}
      <SiteFooter />
    </>
  );
}
