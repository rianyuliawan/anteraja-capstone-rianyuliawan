import { DEFAULT_AWBS, findShipment } from './data.js';
import { createElement, getRequestedAwbs, initMobileMenus } from './common.js';

const results = document.querySelector('#shipment-results');
const summary = document.querySelector('#results-summary');

const buildPartyList = shipment => {
  const list = createElement('dl', 'shipment-result-card__parties');
  [['Pengirim', shipment.sender], ['Penerima', shipment.recipient]].forEach(([label, value]) => {
    const item = createElement('div');
    item.append(createElement('dt', '', label), createElement('dd', '', value));
    list.append(item);
  });
  return list;
};

const buildResult = awb => {
  const shipment = findShipment(awb);
  const card = createElement('article', 'shipment-result-card');
  if (!shipment) {
    card.classList.add('shipment-result-card--not-found');
    const identity = createElement('div', 'shipment-result-card__identity');
    identity.append(createElement('p', 'label', 'Nomor AWB'), createElement('h2', '', awb), createElement('span', 'status-badge status-badge--error', 'Tidak ditemukan'));
    const message = createElement('div', 'shipment-result-card__latest');
    message.append(createElement('p', 'label', 'Status pencarian'), createElement('p', '', 'Nomor AWB belum tersedia pada data prototype. Periksa kembali nomor yang dimasukkan.'));
    const retry = createElement('a', 'button button--secondary', 'Periksa AWB');
    retry.href = `index.html?awbs=${encodeURIComponent(awb)}`;
    card.append(identity, createElement('div'), message, retry);
    return card;
  }

  const identity = createElement('div', 'shipment-result-card__identity');
  identity.append(createElement('p', 'label', 'Nomor AWB'), createElement('h2', '', shipment.awb));
  identity.append(createElement('span', `status-badge ${shipment.statusClass}`.trim(), shipment.status));

  const latest = createElement('div', 'shipment-result-card__latest');
  latest.append(createElement('p', 'label', 'Status terakhir'), createElement('p', '', shipment.latestDescription));
  const time = createElement('time', '', shipment.lastAtLabel);
  time.dateTime = shipment.lastAt;
  latest.append(time);

  const link = createElement('a', 'button button--primary', 'Lihat Detail');
  link.href = `${shipment.stage === 'DELIVERED' ? 'tracking-delivered.html' : 'tracking.html'}?awb=${encodeURIComponent(shipment.awb)}`;
  card.append(identity, buildPartyList(shipment), latest, link);
  return card;
};

if (results && summary) {
  const requested = getRequestedAwbs();
  const awbs = requested.length ? requested : DEFAULT_AWBS;
  results.replaceChildren(...awbs.map(buildResult));
  const found = awbs.filter(findShipment).length;
  summary.textContent = `${found} dari ${awbs.length} paket ditemukan. Informasi identitas ditampilkan secara tersamarkan untuk menjaga privasi.`;
}

initMobileMenus();
