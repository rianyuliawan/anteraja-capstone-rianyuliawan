import { useEffect, useState } from "react";
import {
  Navigate,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import SearchHero from "../../components/SearchHero";
import ShipmentResults from "../../components/ShipmentResults";
import { getShipments } from "../../api/shipments";
import { trackingUrl } from "../../utils/awb";

export function Results() {
  const navigate = useNavigate();
  const { showToast, searchedAwbs: awbs, setSearchedAwbs } = useOutletContext();
  const awbKey = awbs.join(",");
  const [request, setRequest] = useState({ key: "", shipments: {}, error: "" });
  const isLoading = Boolean(awbKey) && request.key !== awbKey;
  const shipments = isLoading ? {} : request.shipments;
  const error = isLoading ? "" : request.error;

  useEffect(() => {
    if (!awbKey) return;
    const controller = new AbortController();
    getShipments(awbKey.split(","), controller.signal)
      .then((data) => setRequest({ key: awbKey, shipments: data, error: "" }))
      .catch((cause) => {
        if (cause.name !== "AbortError") {
          setRequest({ key: awbKey, shipments: {}, error: cause.message });
        }
      });
    return () => controller.abort();
  }, [awbKey]);
  const handleSearch = (next) => {
    setSearchedAwbs(next);
    document.getElementById("hasil")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };
  if (awbs.length === 0) return <Navigate to="/" replace />;
  return (
    <>
      <SearchHero awbs={awbs} onSearch={handleSearch} onNotify={showToast} />
      {isLoading && (
        <p role="status" className="rounded-card bg-white p-5">
          Memuat hasil pengiriman…
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-card bg-danger-100 p-5 text-danger-700">
          {error}
        </p>
      )}
      {awbs.length > 0 && !isLoading && !error && (
        <ShipmentResults
          awbs={awbs}
          shipments={shipments}
          onSelect={(awb) => navigate(trackingUrl(awb))}
        />
      )}
      {awbs.length === 0 && (
        <p className="rounded-card border border-ink-200 bg-white p-5 text-center text-sm text-ink-600">
          Masukkan nomor resi untuk menampilkan hasil pengiriman.
        </p>
      )}
    </>
  );
}
