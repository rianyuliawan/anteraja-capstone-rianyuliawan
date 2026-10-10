import { useState } from "react";
import { FiX } from "react-icons/fi";
import Button from "../ui/Button";

const MAX_AWBS = 10;
const AWB_PATTERN = /^ANT-FRZ-\d{4}$/;

export function AwbSearchForm({ initialAwbs = [], onSearch, onNotify }) {
  const [awbs, setAwbs] = useState(initialAwbs);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const parse = (input) => {
    const candidates = input
      .split(/[\s,;]+/)
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
    const invalid = candidates.find((item) => !AWB_PATTERN.test(item));
    if (invalid) {
      setError(`Format ${invalid} belum sesuai. Contoh: ANT-FRZ-0002.`);
      return null;
    }
    const combined = [...new Set([...awbs, ...candidates])];
    if (combined.length > MAX_AWBS) {
      setError(`Maksimal ${MAX_AWBS} nomor resi dalam satu pencarian.`);
      return null;
    }
    setError("");
    return combined;
  };
  const addDraft = () => {
    if (!draft.trim()) return;
    const next = parse(draft);
    if (!next) return;
    setAwbs(next);
    setDraft("");
    if (next.length > awbs.length) onNotify("Resi berhasil dimasukkan.");
  };
  const handleKeyDown = (event) => {
    if (event.key !== ",") return;
    event.preventDefault();
    addDraft();
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    const next = parse(draft);
    if (!next) return;
    if (!next.length) {
      setError("Masukkan minimal satu nomor resi.");
      return;
    }
    setAwbs(next);
    setDraft("");
    if (next.length > awbs.length) onNotify("Resi berhasil dimasukkan.");
    onSearch(next);
  };
  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="rounded-card-lg border border-ink-200 bg-white p-4 shadow-card-raised sm:p-6"
    >
      <p className="mb-4 text-sm text-ink-600">
        Masukkan maksimal 10 nomor resi. Pisahkan dengan koma, lalu tekan Enter
        untuk mencari.
      </p>
      <label
        htmlFor="tracking-number"
        className="mb-2 block text-sm font-bold text-ink-700"
      >
        Nomor resi / AWB
      </label>
      <div className="flex min-h-14 flex-wrap items-center gap-2 rounded-card border border-ink-300 bg-white p-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
        {awbs.map((awb) => (
          <span
            key={awb}
            className="inline-flex min-h-8 items-center gap-1 rounded-full bg-brand-500 py-1 pr-1 pl-3 text-xs font-bold text-white"
          >
            {awb}
            <button
              type="button"
              className="grid size-6 shrink-0 place-items-center rounded-full p-0 leading-none hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label={`Hapus ${awb}`}
              onClick={() => {
                setAwbs(awbs.filter((item) => item !== awb));
                setError("");
                onNotify("Resi dihapus dari daftar pencarian.", "info");
              }}
            >
              <FiX aria-hidden="true" className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          id="tracking-number"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          className="min-w-36 flex-1 border-0 bg-transparent px-2 py-1 text-sm text-ink-950 uppercase outline-none focus-visible:outline-2 focus-visible:outline-brand-500 placeholder:normal-case placeholder:text-ink-500"
          placeholder="Masukkan nomor resi"
          autoComplete="off"
          aria-describedby="awb-feedback"
          aria-invalid={Boolean(error)}
        />
      </div>
      <p
        id="awb-feedback"
        role="status"
        aria-live="polite"
        className={`mt-2 min-h-5 text-xs ${error ? "text-danger-700" : "text-ink-500"}`}
      >
        {error || `${awbs.length} dari ${MAX_AWBS} nomor resi`}
      </p>
      <Button type="submit" className="mt-3 w-full">
        Lacak Paket
      </Button>
    </form>
  );
}
