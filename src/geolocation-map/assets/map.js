import { locations } from "./shipments.js";

const mapElement = document.getElementById("shipment-map");
const messageElement = document.getElementById("map-message");
const countElement = document.getElementById("marker-count");
const listElement = document.getElementById("location-list");
const listButtons = new Map();

function showMessage(message) {
  messageElement.hidden = false;
  messageElement.textContent = message;
}

function makeInfoContent(item) {
  const content = document.createElement("div");
  content.className = "info-window";
  const title = document.createElement("strong");
  title.textContent = item.code;
  const status = document.createElement("p");
  status.textContent = `Status: ${item.status}`;
  const place = document.createElement("p");
  place.textContent = `Lokasi: ${item.place}`;
  content.append(title, status, place);
  return content;
}

function renderList(items) {
  items.forEach((item) => {
    const row = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "location-button";
    button.disabled = true;
    const top = document.createElement("span");
    top.className = "location-title";
    const code = document.createElement("span");
    code.textContent = item.code;
    const type = document.createElement("span");
    type.className = `type-tag ${item.kind === "shipment" ? "type-tag--shipment" : ""}`;
    type.textContent = item.kind === "shipment" ? "Paket" : "Kurir";
    top.append(code, type);
    const place = document.createElement("span");
    place.className = "location-detail";
    place.textContent = item.place;
    const status = document.createElement("span");
    status.className = "location-status";
    status.textContent = item.status;
    button.append(top, place, status);
    row.append(button);
    listElement.append(row);
    listButtons.set(item.id, button);
  });
}

async function loadGoogleMaps(key) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const url = new URL("https://maps.googleapis.com/maps/api/js");
    url.searchParams.set("key", key);
    url.searchParams.set("v", "weekly");
    url.searchParams.set("loading", "async");
    url.searchParams.set("callback", "initShipmentMapApi");
    script.src = url.toString();
    script.async = true;
    window.initShipmentMapApi = () => {
      delete window.initShipmentMapApi;
      resolve();
    };
    script.onerror = () => reject(new Error("Google Maps tidak dapat dimuat."));
    document.head.append(script);
  });
}

async function initMap() {
  renderList(locations);
  countElement.textContent = `${locations.length} lokasi contoh`;

  let key;
  try {
    ({ GOOGLE_MAPS_API_KEY: key } = await import("../config.local.js"));
  } catch {
    showMessage("API key belum disiapkan. Salin config.example.js menjadi config.local.js, lalu isi key Google Maps yang sudah dibatasi.");
    return;
  }
  if (!key || key.startsWith("ISI_")) {
    showMessage("Isi GOOGLE_MAPS_API_KEY di config.local.js untuk memuat peta.");
    return;
  }

  try {
    await loadGoogleMaps(key);
    const [{ Map: GoogleMap, InfoWindow }, { AdvancedMarkerElement, PinElement }, { LatLngBounds }] =
      await Promise.all([
        google.maps.importLibrary("maps"),
        google.maps.importLibrary("marker"),
        google.maps.importLibrary("core"),
      ]);
    const map = new GoogleMap(mapElement, {
      center: { lat: -6.2, lng: 106.82 },
      zoom: 10,
      mapId: "DEMO_MAP_ID",
      mapTypeControl: false,
      streetViewControl: false,
    });
    const infoWindow = new InfoWindow();
    const bounds = new LatLngBounds();

    locations.forEach((item) => {
      const position = { lat: item.lat, lng: item.lng };
      const pin = new PinElement({
        background: item.kind === "shipment" ? "#e90074" : "#0d6b9b",
        borderColor: "#ffffff",
        glyphColor: "#ffffff",
        glyphText: item.kind === "shipment" ? "P" : "K",
      });
      const marker = new AdvancedMarkerElement({
        map,
        position,
        title: `${item.code}, ${item.status}`,
        content: pin,
      });
      const openInfo = () => {
        infoWindow.setContent(makeInfoContent(item));
        infoWindow.open({ map, anchor: marker });
        map.panTo(position);
      };
      marker.addListener("click", openInfo);
      const button = listButtons.get(item.id);
      button.disabled = false;
      button.addEventListener("click", openInfo);
      bounds.extend(position);
    });

    map.fitBounds(bounds, 45);
    messageElement.hidden = true;
  } catch (error) {
    showMessage(`Peta belum dapat ditampilkan: ${error.message} Periksa API key, pembatasan domain, dan billing Google Cloud.`);
  }
}

initMap();
