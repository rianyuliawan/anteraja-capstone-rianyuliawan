const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

const loadLeaflet = () => new Promise((resolve, reject) => {
  if (window.L) return resolve(window.L);
  if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS;
    link.crossOrigin = '';
    document.head.append(link);
  }
  const script = document.createElement('script');
  script.src = LEAFLET_JS;
  script.crossOrigin = '';
  script.onload = () => resolve(window.L);
  script.onerror = () => reject(new Error('Leaflet gagal dimuat'));
  document.head.append(script);
});

export const initRouteMap = async shipment => {
  const container = document.querySelector('#leaflet-map');
  const fallback = document.querySelector('.route-map');
  const status = document.querySelector('#map-status');
  if (!container || !shipment?.route) return;

  try {
    status.textContent = 'Memuat peta interaktif…';
    const L = await loadLeaflet();
    container.hidden = false;
    const map = L.map(container, { scrollWheelZoom: false, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const latlngs = shipment.route.points.map(([, lat, lng]) => [lat, lng]);
    const completedEnd = Math.min(shipment.route.completedIndex + 1, latlngs.length - 1);
    const completed = latlngs.slice(0, completedEnd + 1);
    const remaining = latlngs.slice(completedEnd);
    if (completed.length > 1) L.polyline(completed, { color: '#ed0677', weight: 5 }).addTo(map);
    if (remaining.length > 1) L.polyline(remaining, { color: '#94a3b8', weight: 4, dashArray: '7 9' }).addTo(map);

    shipment.route.points.forEach(([name, lat, lng], index) => {
      const reached = index <= completedEnd;
      L.circleMarker([lat, lng], {
        radius: index === completedEnd ? 10 : 8,
        color: reached ? '#ed0677' : '#64748b',
        fillColor: reached ? '#ed0677' : '#ffffff',
        fillOpacity: 1,
        weight: 3
      }).addTo(map).bindPopup(`<strong>${index + 1}. ${name}</strong><br>${reached ? 'Telah tercatat' : 'Titik berikutnya'}`);
    });
    map.fitBounds(L.latLngBounds(latlngs), { padding: [32, 32] });
    fallback.hidden = true;
    status.textContent = 'Peta interaktif menggunakan OpenStreetMap. Titik bersifat ilustratif, bukan GPS langsung.';
    document.querySelector('.route-map-disclosure')?.addEventListener('toggle', () => setTimeout(() => map.invalidateSize(), 30));
  } catch {
    status.textContent = 'Peta interaktif tidak dapat dimuat. Peta ilustratif tetap ditampilkan.';
  }
};
