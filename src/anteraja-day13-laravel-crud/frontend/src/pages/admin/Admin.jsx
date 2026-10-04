import { useEffect, useState } from "react";
import Panel from "../../components/ui/Panel";

const emptyShipment = {
  awb: "", sender_name: "", recipient_name: "", origin: "", destination: "",
  weight_kg: "", status: "pending", courier_id: "", thermal_asset_id: "",
};
const emptyCourier = { code: "", name: "", rating: "5.0", is_active: true };
const fields = [
  ["awb", "Nomor AWB"], ["sender_name", "Nama pengirim"],
  ["recipient_name", "Nama penerima"], ["origin", "Asal"],
  ["destination", "Tujuan"], ["weight_kg", "Berat (kg)"],
];

async function jsonRequest(path, options) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) {
    const firstError = data.errors && Object.values(data.errors)[0]?.[0];
    throw new Error(firstError || data.message || "Permintaan gagal.");
  }
  return data;
}

export function Admin() {
  const [shipments, setShipments] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [shipment, setShipment] = useState(emptyShipment);
  const [courier, setCourier] = useState(emptyCourier);
  const [editingShipment, setEditingShipment] = useState(null);
  const [editingCourier, setEditingCourier] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function reload() {
    const [shipmentData, courierData, assetData] = await Promise.all([
      jsonRequest("/api/admin/shipments"),
      jsonRequest("/api/couriers"),
      jsonRequest("/api/assets"),
    ]);
    setShipments(shipmentData.shipments);
    setCouriers(courierData.couriers);
    setAssets(assetData.assets);
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      jsonRequest("/api/admin/shipments"),
      jsonRequest("/api/couriers"),
      jsonRequest("/api/assets"),
    ]).then(([a, b, c]) => {
      if (active) { setShipments(a.shipments); setCouriers(b.couriers); setAssets(c.assets); }
    }).catch((cause) => { if (active) setError(cause.message); });
    return () => { active = false; };
  }, []);

  async function saveShipment(event) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const path = editingShipment ? `/api/admin/shipments/${editingShipment}` : "/api/admin/shipments";
      await jsonRequest(path, {
        method: editingShipment ? "PUT" : "POST",
        body: JSON.stringify({
          ...shipment,
          weight_kg: Number(shipment.weight_kg),
          courier_id: Number(shipment.courier_id),
          thermal_asset_id: shipment.thermal_asset_id ? Number(shipment.thermal_asset_id) : null,
        }),
      });
      await reload();
      setShipment(emptyShipment); setEditingShipment(null);
      setMessage(editingShipment ? "Pengiriman berhasil diperbarui." : "Pengiriman berhasil ditambahkan.");
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }

  async function saveCourier(event) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      await jsonRequest(editingCourier ? `/api/couriers/${editingCourier}` : "/api/couriers", {
        method: editingCourier ? "PUT" : "POST",
        body: JSON.stringify({ ...courier, rating: Number(courier.rating) }),
      });
      await reload();
      setCourier(emptyCourier); setEditingCourier(null);
      setMessage(editingCourier ? "Kurir berhasil diperbarui." : "Kurir berhasil ditambahkan.");
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }

  async function remove(kind, id) {
    if (!window.confirm(`Hapus ${kind === "courier" ? "kurir" : "pengiriman"} ini?`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await jsonRequest(kind === "courier" ? `/api/couriers/${id}` : `/api/admin/shipments/${id}`, { method: "DELETE" });
      await reload();
      setSelected(null);
      setMessage("Data berhasil dihapus.");
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }

  async function viewShipment(id) {
    try {
      const data = await jsonRequest(`/api/admin/shipments/${id}`);
      setSelected(data.shipment);
    } catch (cause) { setError(cause.message); }
  }

  const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-ink-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand-500";
  const actionClass = "rounded-full border border-brand-200 px-3 py-2 text-xs font-bold text-brand-700 hover:bg-brand-50 disabled:opacity-50";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-brand-700">Latihan Laravel Day 13</p>
        <h1 className="mt-2 text-3xl font-extrabold">Kelola kurir & pengiriman</h1>
        <p className="mt-2 text-sm text-ink-600">Data disimpan di PostgreSQL lokal melalui Laravel Eloquent.</p>
      </div>
      {message && <p role="status" className="rounded-card bg-success-100 p-3 text-sm text-success-700">{message}</p>}
      {error && <p role="alert" className="rounded-card bg-danger-100 p-3 text-sm text-danger-700">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel as="section">
          <h2 className="text-xl font-extrabold">{editingCourier ? "Ubah kurir" : "Tambah kurir"}</h2>
          <form onSubmit={saveCourier} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold">Kode kurir<input className={inputClass} required value={courier.code} onChange={(e) => setCourier({ ...courier, code: e.target.value.toUpperCase() })} /></label>
            <label className="text-sm font-bold">Nama kurir<input className={inputClass} required value={courier.name} onChange={(e) => setCourier({ ...courier, name: e.target.value })} /></label>
            <label className="text-sm font-bold">Rating (0–5)<input className={inputClass} required type="number" min="0" max="5" step="0.1" value={courier.rating} onChange={(e) => setCourier({ ...courier, rating: e.target.value })} /></label>
            <label className="text-sm font-bold">Status<select className={inputClass} value={String(courier.is_active)} onChange={(e) => setCourier({ ...courier, is_active: e.target.value === "true" })}><option value="true">Aktif</option><option value="false">Tidak aktif</option></select></label>
            <div className="flex gap-2 sm:col-span-2">
              <button disabled={busy} className="rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{editingCourier ? "Simpan perubahan" : "Tambah kurir"}</button>
              {editingCourier && <button type="button" className={actionClass} onClick={() => { setCourier(emptyCourier); setEditingCourier(null); }}>Batal</button>}
            </div>
          </form>
        </Panel>
        <Panel as="section">
          <h2 className="text-xl font-extrabold">Daftar kurir ({couriers.length})</h2>
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
            {couriers.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-200 p-3 text-sm">
              <div><strong>{item.name}</strong><p className="text-xs text-ink-500">{item.code} · Rating {item.rating} · {item.shipments_count} paket</p></div>
              <div className="flex gap-1"><button className={actionClass} onClick={() => { setEditingCourier(item.id); setCourier({ code: item.code, name: item.name, rating: item.rating, is_active: item.is_active }); }}>Ubah</button><button disabled={busy} className={actionClass} onClick={() => remove("courier", item.id)}>Hapus</button></div>
            </div>)}
          </div>
        </Panel>
      </div>
      <Panel as="section">
        <h2 className="text-xl font-extrabold">{editingShipment ? "Ubah pengiriman" : "Tambah pengiriman"}</h2>
        <form onSubmit={saveShipment} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(([name, label]) => <label key={name} className="text-sm font-bold">{label}<input className={inputClass} required type={name === "weight_kg" ? "number" : "text"} min={name === "weight_kg" ? "0.01" : undefined} step={name === "weight_kg" ? "0.01" : undefined} value={shipment[name]} onChange={(e) => setShipment({ ...shipment, [name]: name === "awb" ? e.target.value.toUpperCase() : e.target.value })} /></label>)}
          <label className="text-sm font-bold">Status<select className={inputClass} value={shipment.status} onChange={(e) => setShipment({ ...shipment, status: e.target.value })}><option value="pending">Menunggu pickup</option><option value="in_transit">Dalam perjalanan</option><option value="out_for_delivery">Sedang diantar</option><option value="delivered">Terkirim</option></select></label>
          <label className="text-sm font-bold">Kurir<select required className={inputClass} value={shipment.courier_id} onChange={(e) => setShipment({ ...shipment, courier_id: e.target.value })}><option value="">Pilih kurir</option>{couriers.filter((item) => item.is_active || Number(shipment.courier_id) === item.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-sm font-bold">Aset suhu<select className={inputClass} value={shipment.thermal_asset_id || ""} onChange={(e) => setShipment({ ...shipment, thermal_asset_id: e.target.value })}><option value="">Belum ditentukan</option>{assets.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></label>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3"><button disabled={busy} className="rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{editingShipment ? "Simpan perubahan" : "Tambah pengiriman"}</button>{editingShipment && <button type="button" className={actionClass} onClick={() => { setShipment(emptyShipment); setEditingShipment(null); }}>Batal</button>}</div>
        </form>
      </Panel>
      <Panel as="section">
        <h2 className="text-xl font-extrabold">Daftar pengiriman ({shipments.length})</h2>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[45rem] text-left text-sm"><thead className="border-b border-ink-200 text-xs uppercase text-ink-500"><tr><th className="p-3">AWB</th><th className="p-3">Pengirim → penerima</th><th className="p-3">Berat</th><th className="p-3">Status</th><th className="p-3">Kurir</th><th className="p-3">Aksi</th></tr></thead><tbody>{shipments.map((item) => <tr key={item.id} className="border-b border-ink-100"><td className="p-3 font-bold">{item.awb}</td><td className="p-3">{item.sender_name} → {item.recipient_name}</td><td className="p-3">{item.weight_kg} kg</td><td className="p-3">{item.status}</td><td className="p-3">{item.courier?.name}</td><td className="flex gap-1 p-3"><button className={actionClass} onClick={() => viewShipment(item.id)}>Detail</button><button className={actionClass} onClick={() => { setEditingShipment(item.id); setShipment({ ...item, courier_id: String(item.courier_id), thermal_asset_id: item.thermal_asset_id ? String(item.thermal_asset_id) : "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Ubah</button><button disabled={busy} className={actionClass} onClick={() => remove("shipment", item.id)}>Hapus</button></td></tr>)}</tbody></table></div>
        {selected && <div className="mt-5 rounded-card bg-ink-50 p-4 text-sm"><h3 className="font-extrabold">Detail {selected.awb}</h3><p>{selected.origin} → {selected.destination} · {selected.weight_kg} kg</p><p>Kurir: {selected.courier?.name} · Aset: {selected.thermal_asset?.code || "Belum ada"}</p></div>}
      </Panel>
    </div>
  );
}
