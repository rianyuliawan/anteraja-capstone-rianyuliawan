import { findShipment } from './data.js';
import { copyText, formatTemperature, initMobileMenus, thermalState } from './common.js';
import { initRouteMap } from './route-map.js';

const params = new URLSearchParams(location.search);
const requestedAwb = (params.get('awb') || document.body.dataset.defaultAwb || '').toUpperCase();
const shipment = findShipment(requestedAwb) || findShipment(document.body.dataset.defaultAwb);

const setText = (selector, value) => { const node = document.querySelector(selector); if (node) node.textContent = value; };
const setTime = (node, iso, label) => { if (!node) return; node.dateTime = iso; node.textContent = label; };

const renderSummary = () => {
  document.title = `${shipment.awb} | Anteraja Frozen`;
  const input = document.querySelector('.compact-search input[name="awb"]');
  if (input) input.value = shipment.awb;
  setText('#shipment-summary-title', shipment.awb);
  const badge = document.querySelector('.shipment-summary-card .status-badge');
  if (badge) { badge.className = `status-badge ${shipment.statusClass}`.trim(); badge.textContent = shipment.status; }
  const path = document.querySelectorAll('.shipment-path dd');
  if (path[0]) path[0].textContent = shipment.origin;
  if (path[1]) path[1].textContent = shipment.destination;
  const meta = document.querySelectorAll('.summary-meta dd');
  [shipment.sender, shipment.recipient, shipment.status].forEach((value, index) => { if (meta[index]) meta[index].textContent = value; });
  setTime(meta[3]?.querySelector('time'), shipment.lastAt, shipment.lastAtLabel);
};

const renderTimeline = () => {
  const list = document.querySelector('.timeline');
  if (!list) return;
  list.innerHTML = shipment.events.map((event, index) => `<li class="timeline__item ${event[5] ? 'timeline__item--delivered' : ''}">
    <span class="timeline__marker" aria-hidden="true">${shipment.events.length - index}</span>
    <article class="timeline__card"><div class="timeline__topline"><span class="timeline__status">${event[0]}</span><time datetime="${event[3]}">${event[4]}</time></div><h3>${event[1]}</h3><p>${event[2]}</p></article>
  </li>`).join('');
};

const evidenceCard = (type, evidence) => {
  const isPickup = type === 'pickup';
  const title = isPickup ? 'Foto pickup' : 'Foto penerimaan';
  if (!evidence) return `<article class="evidence-card evidence-card--pending"><div class="evidence-card__topline"><span class="evidence-card__status">Menunggu</span><span>Belum ada event</span></div><div class="evidence-placeholder" role="img" aria-label="${title} belum tersedia"><div><h3>${title}</h3><p>Akan tersedia setelah kejadian pengiriman tercatat.</p></div></div></article>`;
  const visual = evidence.image
    ? `<figure class="evidence-preview"><button class="evidence-preview__button" type="button" data-evidence-image="${evidence.image}" data-evidence-caption="${title} · ${evidence.time}"><img src="${evidence.image}" width="1280" height="720" loading="lazy" alt="${title} ${shipment.awb}"></button><figcaption><strong>${title}</strong><span>${isPickup ? evidence.location : evidence.receiver}</span></figcaption></figure>`
    : `<div class="evidence-placeholder"><div><h3>${title}</h3><p>Catatan serah terima tersedia tanpa foto.</p></div></div>`;
  return `<article class="evidence-card ${isPickup ? '' : 'evidence-card--delivered'}"><div class="evidence-card__topline"><span class="evidence-card__status evidence-card__status--available">Tercatat</span><span>${evidence.time}</span></div>${visual}<dl class="evidence-receipt"><div><dt>${isPickup ? 'Kurir pickup' : 'Kurir delivery'}</dt><dd>${evidence.courier}</dd></div><div><dt>${isPickup ? 'Diserahkan oleh' : 'Penerima'}</dt><dd>${isPickup ? evidence.party : evidence.receiver}</dd></div><div><dt>Keterangan</dt><dd>${evidence.note}</dd></div></dl></article>`;
};

const renderEvidence = () => {
  const grid = document.querySelector('.evidence-grid');
  if (!grid) return;
  grid.innerHTML = evidenceCard('pickup', shipment.pickup) + evidenceCard('delivery', shipment.delivery);
  const count = [shipment.pickup?.image, shipment.delivery?.image].filter(Boolean).length;
  setText('.evidence-count', `${count}/2 foto tersedia`);
};

const renderTemperature = () => {
  const temp = shipment.temperature;
  const state = shipment.stage === 'DELIVERED' ? { key: 'complete', label: 'Selesai' } : thermalState(temp.value, temp.normalLow, temp.normalHigh);
  const card = document.querySelector('.temperature-card');
  if (card) card.dataset.thermalState = state.key;
  setText('.thermal-status', state.label);
  setText('.temperature-reading__asset', temp.asset);
  setText('.temperature-reading__code', `Kode aset: ${temp.code}`);
  setText('.temperature-reading__value', formatTemperature(temp.value));
  setText('.temperature-reading__range', `Rentang normal aset: ${formatTemperature(temp.normalLow)} s.d. ${formatTemperature(temp.normalHigh)}`);
  const observation = document.querySelector('.observation-time time');
  setTime(observation, shipment.lastAt, shipment.lastAtLabel);
  const schedule = document.querySelector('.temperature-schedule');
  if (schedule) schedule.innerHTML = shipment.stage === 'DELIVERED' ? '<p><strong>Pemantauan suhu telah selesai</strong></p><p>Data terakhir dikunci setelah paket diterima.</p>' : `<p><strong>Diperbarui otomatis setiap 60 menit</strong></p><p>Pembaruan berikutnya sekitar <time>${temp.nextAt}</time>.</p>`;
};

const renderSegments = () => {
  const grid = document.querySelector('.segment-grid');
  if (grid) grid.innerHTML = shipment.segments.map(segment => `<article class="segment-card ${segment[1] === 'Aktif' ? 'segment-card--active' : ''}"><div class="segment-card__topline"><p class="label">${segment[0]}</p><span>${segment[1]}</span></div><h3>${segment[2]}</h3><p>${segment[3]}</p><dl><dt>${segment[4]}</dt><dd>${formatTemperature(segment[5])}</dd></dl></article>`).join('');
  const tbody = document.querySelector('.history-table tbody');
  if (tbody) tbody.innerHTML = shipment.history.map(row => `<tr><td data-label="Waktu">${row.timeLabel}</td><td data-label="Aset">${row.asset}</td><td data-label="Suhu">${formatTemperature(row.value)}</td><td data-label="Status"><span class="history-status">${row.status}</span></td><td data-label="Catatan">Pembacaan telemetri terverifikasi</td></tr>`).join('');
};

const initCopy = () => document.querySelector('#copy-awb')?.addEventListener('click', async () => {
  await copyText(shipment.awb);
  setText('#copy-feedback', 'Nomor AWB tersalin.');
  setTimeout(() => setText('#copy-feedback', ''), 2200);
});

const initEvidenceDialog = () => {
  const dialog = document.querySelector('#evidence-dialog');
  if (!dialog) return;
  document.querySelector('.evidence-grid')?.addEventListener('click', event => {
    const button = event.target.closest('[data-evidence-image]');
    if (!button) return;
    dialog.querySelector('img').src = button.dataset.evidenceImage;
    dialog.querySelector('img').alt = button.dataset.evidenceCaption;
    dialog.querySelector('p').textContent = button.dataset.evidenceCaption;
    dialog.showModal();
  });
  dialog.querySelector('.evidence-dialog__close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
};

const initRefresh = () => {
  const button = document.querySelector('#refresh-temperature');
  if (!button || !shipment.refreshCycle.length) return;
  let cycle = 0;
  button.addEventListener('click', () => {
    button.disabled = true;
    button.classList.add('is-loading');
    button.textContent = 'Mengambil suhu…';
    setText('#refresh-status', 'Menghubungkan ke simulator sensor…');
    setTimeout(() => {
      shipment.temperature.value = shipment.refreshCycle[cycle++ % shipment.refreshCycle.length];
      const now = new Date();
      shipment.lastAt = now.toISOString();
      shipment.lastAtLabel = `Baru saja · ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
      renderTemperature();
      const state = thermalState(shipment.temperature.value, shipment.temperature.normalLow, shipment.temperature.normalHigh);
      setText('#refresh-status', `Suhu berhasil diperbarui: ${formatTemperature(shipment.temperature.value)} · ${state.label}.`);
      button.classList.remove('is-loading');
      let remaining = 5;
      button.textContent = `Tunggu ${remaining} detik`;
      const timer = setInterval(() => {
        remaining -= 1;
        button.textContent = remaining ? `Tunggu ${remaining} detik` : 'Ambil Suhu Sekarang';
        if (!remaining) { clearInterval(timer); button.disabled = false; }
      }, 1000);
    }, 900);
  });
};

if (shipment) {
  renderSummary();
  renderTimeline();
  renderEvidence();
  renderTemperature();
  renderSegments();
  initCopy();
  initEvidenceDialog();
  initRefresh();
  initRouteMap(shipment);
}
initMobileMenus();
