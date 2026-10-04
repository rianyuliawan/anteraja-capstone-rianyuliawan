async function getJson(path, signal) {
  const response = await fetch(path, { signal });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Data pengiriman belum dapat dimuat.");
  }
  return data;
}

export async function getShipments(awbs, signal) {
  const query = encodeURIComponent(awbs.join(","));
  const data = await getJson(`/api/shipments?awbs=${query}`, signal);
  return data.shipments;
}

export async function getShipment(awb, signal) {
  const data = await getJson(`/api/shipments/${encodeURIComponent(awb)}`, signal);
  return data.shipment;
}

export async function getTemperatureReadings(awb, signal) {
  return getJson(
    `/api/shipments/${encodeURIComponent(awb)}/temperature-readings`,
    signal,
  );
}
