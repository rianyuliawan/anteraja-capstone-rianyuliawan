import { locations } from "./shipments.js";

const mapElement = document.getElementById("shipment-map");
const messageElement = document.getElementById("map-message");
const countElement = document.getElementById("marker-count");
const listElement = document.getElementById("location-list");
const searchForm = document.getElementById("location-search-form");
const searchInput = document.getElementById("location-search");
const searchButton = document.getElementById("location-search-button");
const searchResult = document.getElementById("search-result");
const listButtons = new Map();

function showMessage(message) {
  messageElement.hidden = false;
  messageElement.textContent = message;
}

function showSearchResult(title, detail = "", isError = false) {
  searchResult.replaceChildren();
  searchResult.hidden = false;
  searchResult.classList.toggle("is-error", isError);
  const heading = document.createElement("strong");
  heading.textContent = title;
  searchResult.append(heading);
  if (detail) {
    const description = document.createElement("span");
    description.textContent = detail;
    searchResult.append(description);
  }
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
  const source = document.createElement("p");
  source.textContent = item.address ? "Sumber: geocoding alamat" : "Sumber: koordinat contoh";
  content.append(title, status, place, source);
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
    window.gm_authFailure = () => {
      showMessage("Google Maps menolak API key. Periksa billing, referrer localhost/127.0.0.1, dan pembatasan API.");
    };
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
    let markerCount = 0;
    let searchMarker;

    searchButton.disabled = false;
    searchForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const address = searchInput.value.trim();
      if (address.length < 3) {
        showSearchResult("Alamat terlalu singkat", "Masukkan setidaknya 3 karakter.", true);
        return;
      }

      searchButton.disabled = true;
      searchButton.textContent = "Mencari…";
      showSearchResult("Mencari koordinat…", "Alamat sedang diproses oleh Google Geocoding API.");

      try {
        const body = new FormData();
        body.set("address", address);
        const response = await fetch("./geocode.php", {
          method: "POST",
          headers: { "X-Geocode-Request": "1" },
          body,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Lokasi tidak ditemukan.");

        const position = { lat: result.lat, lng: result.lng };
        if (searchMarker) searchMarker.map = null;
        searchMarker = new AdvancedMarkerElement({
          map,
          position,
          title: `Hasil geocoding: ${result.address}`,
          content: new PinElement({
            background: "#f0ac28",
            borderColor: "#ffffff",
            glyphColor: "#17253d",
            glyphText: "L",
          }),
          gmpClickable: true,
        });
        const openSearchInfo = () => {
          const content = document.createElement("div");
          content.className = "info-window";
          const title = document.createElement("strong");
          title.textContent = "Hasil geocoding lokasi";
          const place = document.createElement("p");
          place.textContent = result.address;
          const coordinates = document.createElement("p");
          coordinates.textContent = `${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`;
          content.append(title, place, coordinates);
          infoWindow.setContent(content);
          infoWindow.open({ map, anchor: searchMarker });
        };
        searchMarker.addEventListener("gmp-click", openSearchInfo);
        map.panTo(position);
        map.setZoom(14);
        openSearchInfo();
        showSearchResult(
          `Ditemukan: ${result.address}`,
          `Koordinat: ${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}. Pin kuning menunjukkan hasil pencarian.`,
        );
        mapElement.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "center",
        });
      } catch (error) {
        showSearchResult("Lokasi belum ditemukan", error.message, true);
      } finally {
        searchButton.disabled = false;
        searchButton.textContent = "Cari lokasi";
      }
    });

    function addMarker(item, position) {
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
        gmpClickable: true,
      });
      const openInfo = () => {
        infoWindow.setContent(makeInfoContent(item));
        infoWindow.open({ map, anchor: marker });
        map.panTo(position);
      };
      marker.addEventListener("gmp-click", openInfo);
      const button = listButtons.get(item.id);
      button.disabled = false;
      button.addEventListener("click", openInfo);
      bounds.extend(position);
      markerCount += 1;
      map.fitBounds(bounds, 45);
    }

    locations.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
      .forEach((item) => addMarker(item, { lat: item.lat, lng: item.lng }));

    const addressItems = locations.filter((item) => item.address && !Number.isFinite(item.lat));
    if (addressItems.length) {
      for (const item of addressItems) {
        try {
          const response = await fetch(`./geocode.php?id=${encodeURIComponent(item.id)}`);
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Geocoding gagal.");
          addMarker(item, { lat: result.lat, lng: result.lng });
        } catch (error) {
          showMessage(`Peta memuat ${markerCount} dari ${locations.length} penanda. ${item.code}: ${error.message}`);
        }
      }
    }

    countElement.textContent = `${markerCount} dari ${locations.length} penanda`;
    if (markerCount === locations.length) messageElement.hidden = true;
  } catch (error) {
    showMessage(`Peta belum dapat ditampilkan: ${error.message} Periksa API key, pembatasan domain, dan billing Google Cloud.`);
  }
}

initMap();
