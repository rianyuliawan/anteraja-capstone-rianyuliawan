import { useNavigate, useOutletContext } from "react-router-dom";
import SearchHero from "../../components/SearchHero";
import ShipmentResults from "../../components/ShipmentResults";
import { useShipmentContext } from "../../context/ShipmentContext";
import { trackingUrl } from "../../utils/awb";
export function Results() {
  const navigate = useNavigate();
  const { showToast } = useOutletContext();
  const { searchedAwbs: awbs, setSearchedAwbs, shipments } = useShipmentContext();
  const handleSearch = (next) => {
    setSearchedAwbs(next);
    document.getElementById("hasil")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };
  return (
    <>
      <SearchHero awbs={awbs} onSearch={handleSearch} onNotify={showToast} />
      {awbs.length > 0 ? (
        <ShipmentResults
          awbs={awbs}
          shipments={shipments}
          onSelect={(awb) => navigate(trackingUrl(awb))}
        />
      ) : (
        <p className="rounded-card border border-ink-200 bg-white p-5 text-center text-sm text-ink-600">
          Masukkan nomor resi untuk menampilkan hasil pengiriman.
        </p>
      )}
    </>
  );
}
