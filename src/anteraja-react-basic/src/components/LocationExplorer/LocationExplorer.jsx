import { useShipmentContext } from "../../context/ShipmentContext";
import Button from "../ui/Button";
import Panel from "../ui/Panel";

const selectClass = "mt-1 block min-h-11 w-full rounded-card border border-ink-300 bg-white px-3 text-sm disabled:bg-ink-50 disabled:text-ink-500";

function LocationField({ side, label }) {
  const context = useShipmentContext();
  const selected = context[side];
  const data = context[`${side}Data`];
  const id = `location-${side}`;

  return (
    <fieldset className="min-w-0 space-y-3 rounded-card border border-ink-200 p-4">
      <legend className="px-1 text-sm font-extrabold">{label}</legend>
      <label htmlFor={`${id}-province`} className="block text-sm font-semibold">
        Provinsi
        <select
          id={`${id}-province`}
          value={selected.provinceId}
          onChange={(event) => context.changeProvince(side, event.target.value)}
          disabled={data.isLoadingProvinces || Boolean(data.provincesError)}
          className={selectClass}
        >
          <option value="">Pilih provinsi</option>
          {data.provinces.map((province) => (
            <option key={province.id} value={province.id}>{province.name}</option>
          ))}
        </select>
      </label>
      {data.isLoadingProvinces && <p role="status" className="text-xs text-ink-600">Memuat provinsi…</p>}
      {data.provincesError && (
        <p role="alert" className="text-xs text-danger-700">
          Provinsi gagal dimuat. <button type="button" onClick={data.retryProvinces} className="font-bold underline">Coba lagi</button>
        </p>
      )}
      <label htmlFor={`${id}-regency`} className="block text-sm font-semibold">
        Kabupaten/kota
        <select
          id={`${id}-regency`}
          value={selected.regencyId}
          onChange={(event) => context.changeRegency(side, event.target.value)}
          disabled={!selected.provinceId || data.isLoadingRegencies || Boolean(data.regenciesError)}
          className={selectClass}
        >
          <option value="">{data.isLoadingRegencies ? "Memuat kabupaten/kota…" : "Pilih kabupaten/kota"}</option>
          {data.regencies.map((regency) => (
            <option key={regency.id} value={regency.id}>{regency.name}</option>
          ))}
        </select>
      </label>
      {data.regenciesError && (
        <p role="alert" className="text-xs text-danger-700">
          Kabupaten/kota gagal dimuat. <button type="button" onClick={data.retryRegencies} className="font-bold underline">Coba lagi</button>
        </p>
      )}
    </fieldset>
  );
}

function LocationSummary() {
  const { origin, destination, originData, destinationData, changeProvince } = useShipmentContext();
  const describe = (selection, data) => {
    const province = data.provinces.find((item) => item.id === selection.provinceId);
    const regency = data.regencies.find((item) => item.id === selection.regencyId);
    return [regency?.name, province?.name].filter(Boolean).join(", ") || "Belum dipilih";
  };

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card bg-ink-50 p-4 text-sm">
      <p className="min-w-0 text-ink-700">
        <span className="font-bold">Asal:</span> {describe(origin, originData)}
        <span aria-hidden="true" className="mx-2 text-brand-500">→</span>
        <span className="font-bold">Tujuan:</span> {describe(destination, destinationData)}
      </p>
      {(origin.provinceId || destination.provinceId) && (
        <Button variant="ghost" onClick={() => { changeProvince("origin", ""); changeProvince("destination", ""); }}>
          Hapus pilihan
        </Button>
      )}
    </div>
  );
}

export function LocationExplorer() {
  return (
    <Panel aria-labelledby="location-explorer-title" className="mt-8">
      <h2 id="location-explorer-title" className="text-xl font-extrabold">Jelajahi wilayah asal dan tujuan</h2>
      <p className="mt-1 text-sm text-ink-600">
        Pilih wilayah untuk melihat data lokasi dari API publik. Ini simulasi formulir, bukan pemeriksaan cakupan layanan atau tarif.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <LocationField side="origin" label="Asal" />
        <LocationField side="destination" label="Tujuan" />
      </div>
      <LocationSummary />
    </Panel>
  );
}
