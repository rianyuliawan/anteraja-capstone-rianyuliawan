import { notify } from './common.js';

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
    const activeIndex = shipment.stage === 'DELIVERED' ? latlngs.length - 1 : Math.min(shipment.route.completedIndex + 1, latlngs.length - 1);
    const progress = Math.round((activeIndex / (latlngs.length - 1)) * 100);
    const completed = latlngs.slice(0, activeIndex + 1);
    const remaining = latlngs.slice(activeIndex);
    if (completed.length > 1) L.polyline(completed, { color: '#ed0677', weight: 5 }).addTo(map);
    if (remaining.length > 1) L.polyline(remaining, { color: '#94a3b8', weight: 4, dashArray: '7 9' }).addTo(map);

    shipment.route.points.forEach(([name, lat, lng], index) => {
      const reached = index <= activeIndex;
      const current = index === activeIndex;
      const type = index === 0 ? 'Titik pickup' : index === shipment.route.points.length - 1 ? 'Tujuan akhir' : 'Titik transit';
      const icon = L.divIcon({
        className: 'route-marker-wrapper',
        html: `<span class="route-marker ${reached ? 'route-marker--reached' : ''} ${current ? 'route-marker--current' : ''}">${index + 1}</span>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20]
      });
      L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<div class="route-popup"><span>${type}</span><strong>${name}</strong><small>${current && shipment.stage !== 'DELIVERED' ? 'Tahap aktif saat ini' : reached ? 'Telah tercatat' : 'Belum dilalui'}</small></div>`);
    });
    map.fitBounds(L.latLngBounds(latlngs), { padding: [32, 32] });
    const overview = document.createElement('div');
    overview.className = 'route-overview';
    overview.innerHTML = `<div><span>Progres perjalanan</span><strong>${progress}%</strong></div><div><span>${shipment.stage === 'DELIVERED' ? 'Perjalanan selesai' : 'Tahap saat ini'}</span><strong>${shipment.route.points[activeIndex][0]}</strong></div><div><span>Pembaruan terakhir</span><strong>${shipment.lastAtLabel}</strong></div><div class="route-progress" aria-label="Progres rute ${progress} persen"><i style="width:${progress}%"></i></div>`;
    container.before(overview);
    const legend = document.createElement('div');
    legend.className = 'route-map-legend';
    legend.innerHTML = `<span><i class="route-map-legend__dot route-map-legend__dot--done"></i>Tercatat</span><span><i class="route-map-legend__dot route-map-legend__dot--current"></i>${shipment.stage === 'DELIVERED' ? 'Tujuan akhir' : 'Tahap aktif'}</span>${shipment.stage === 'DELIVERED' ? '' : '<span><i class="route-map-legend__dot"></i>Belum dilalui</span>'}<small>Rute ilustratif · bukan pelacakan GPS langsung</small>`;
    container.after(legend);
    fallback.hidden = true;
    status.textContent = '';
    document.querySelector('.route-map-disclosure')?.addEventListener('toggle', () => setTimeout(() => map.invalidateSize(), 30));
  } catch {
    status.textContent = 'Peta interaktif tidak dapat dimuat. Peta ilustratif tetap ditampilkan.';
    notify('Peta interaktif tidak dapat dimuat. Fallback ilustratif ditampilkan.', 'warning');
  }
};
