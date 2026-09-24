const makeTemperatureHistory = (asset, values, times) => values.map((value, index) => ({
  observedAt: `2026-09-18T${times[index]}:00+07:00`,
  timeLabel: `${times[index].replace(':', '.')} WIB`,
  asset,
  value,
  status: value > 0 ? 'Kritis' : value > -2 ? 'Perlu perhatian' : 'Normal'
}));

export const DEFAULT_AWBS = [
  'ANT-FRZ-0002',
  'ANT-FRZ-0006',
  'ANT-FRZ-0009',
  'ANT-FRZ-0012',
  'ANT-FRZ-0014'
];

export const SHIPMENTS = {
  'ANT-FRZ-0002': {
    awb: 'ANT-FRZ-0002',
    stage: 'IN_TRANSIT',
    status: 'Dalam perjalanan',
    statusClass: '',
    sender: 'PT S***** L*** S****',
    recipient: 'R**** D***',
    origin: 'Kawasan Kemayoran, Jakarta Pusat',
    destination: 'Kawasan Pasar Minggu, Jakarta Selatan',
    latestDescription: 'Berangkat dari hub dan sedang menuju titik berikutnya.',
    lastAt: '2026-09-18T14:30:00+07:00',
    lastAtLabel: '18 Sep 2026 · 14.30 WIB',
    temperature: { asset: 'Mobil boks pendingin', code: 'REEFER-BOX-01', value: -5.1, normalLow: -8, normalHigh: -2, nextAt: '15.30 WIB' },
    refreshCycle: [-5.0, -1.4, 1.8, -5.2],
    events: [
      ['Dalam perjalanan', 'Berangkat menuju hub tujuan', 'Perjalanan antartitik menuju Hub Pasar Minggu telah tercatat.', '2026-09-18T14:30:00+07:00', '18 Sep 2026 · 14.30 WIB'],
      ['Keluar dari hub', 'Berangkat dari Hub Cempaka Mas', 'Paket tercatat keluar dari titik transit untuk melanjutkan perjalanan.', '2026-09-18T13:15:00+07:00', '18 Sep 2026 · 13.15 WIB'],
      ['Tiba di hub', 'Tiba di Hub Cempaka Mas', 'Paket telah tercatat tiba di titik transit.', '2026-09-18T11:40:00+07:00', '18 Sep 2026 · 11.40 WIB'],
      ['Paket diambil', 'Paket diambil dari titik pickup', 'Kurir pickup Satria Ahmad F. menerima paket di kawasan Kemayoran.', '2026-09-18T09:15:00+07:00', '18 Sep 2026 · 09.15 WIB']
    ],
    pickup: { image: 'assets/images/evidence/ANT-FRZ-0002-pickup.webp', time: '18 Sep 2026 · 09.15 WIB', courier: 'Satria Ahmad F.', party: 'PT S***** L*** S**** (pengirim)', note: 'Paket dan segel diterima dalam kondisi baik.', location: 'Kawasan Kemayoran, Jakarta Pusat' },
    delivery: null,
    segments: [
      ['Segmen 1', 'Selesai', 'Cooler Bag CB-12', 'Penjemputan awal', 'Pembacaan akhir', -5.4],
      ['Segmen 2', 'Selesai', 'Hub Freezer HF-03', 'Penyimpanan hub', 'Pembacaan akhir', -4.1],
      ['Segmen 3', 'Aktif', 'Mobil Boks BOX-01', 'Perjalanan antarhub', 'Pembacaan terbaru', -5.1]
    ],
    history: makeTemperatureHistory('Mobil Boks BOX-01', [-5.1, -5.3, -5.0, -4.1, -5.4], ['14:30', '14:00', '13:30', '13:15', '09:15']),
    route: {
      center: [-6.194, 106.855], completedIndex: 1,
      points: [
        ['Kemayoran', -6.166, 106.853],
        ['Hub Cempaka Mas', -6.174, 106.875],
        ['Hub Pasar Minggu', -6.287, 106.845],
        ['Kawasan tujuan', -6.289, 106.838]
      ]
    }
  },
  'ANT-FRZ-0006': {
    awb: 'ANT-FRZ-0006', stage: 'OUT_FOR_DELIVERY', status: 'Sedang diantar', statusClass: 'status-badge--delivery',
    sender: 'T*** F***** B*****', recipient: 'D*** P******',
    origin: 'Kawasan Kelapa Gading, Jakarta Utara', destination: 'Kawasan Tebet, Jakarta Selatan',
    latestDescription: 'Kurir sedang membawa paket menuju kawasan penerima.',
    lastAt: '2026-09-18T15:58:00+07:00', lastAtLabel: '18 Sep 2026 · 15.58 WIB',
    temperature: { asset: 'Cooler bag last mile', code: 'COOLER-BAG-06', value: -4.8, normalLow: -8, normalHigh: -2, nextAt: '16.58 WIB' },
    refreshCycle: [-4.7, -1.5, 1.2, -4.9],
    events: [
      ['Sedang diantar', 'Kurir menuju kawasan penerima', 'Satria Dimas P. membawa paket menggunakan cooler bag terpantau.', '2026-09-18T15:58:00+07:00', '18 Sep 2026 · 15.58 WIB'],
      ['Keluar dari hub', 'Berangkat dari Hub Tebet', 'Paket diserahkan kepada kurir last mile.', '2026-09-18T15:20:00+07:00', '18 Sep 2026 · 15.20 WIB'],
      ['Tiba di hub', 'Tiba di Hub Tebet', 'Paket masuk ke area penyimpanan dingin.', '2026-09-18T13:45:00+07:00', '18 Sep 2026 · 13.45 WIB'],
      ['Paket diambil', 'Paket diambil dari pengirim', 'Kurir pickup Satria Bima R. menerima paket dalam kondisi baik.', '2026-09-18T10:05:00+07:00', '18 Sep 2026 · 10.05 WIB']
    ],
    pickup: { image: null, time: '18 Sep 2026 · 10.05 WIB', courier: 'Satria Bima R.', party: 'T*** F***** B***** (pengirim)', note: 'Paket diterima tanpa kerusakan kemasan.', location: 'Kawasan Kelapa Gading, Jakarta Utara' },
    delivery: null,
    segments: [
      ['Segmen 1', 'Selesai', 'Cooler Bag CB-06', 'Penjemputan awal', 'Pembacaan akhir', -5.6],
      ['Segmen 2', 'Selesai', 'Hub Freezer HF-06', 'Penyimpanan hub', 'Pembacaan akhir', -4.6],
      ['Segmen 3', 'Aktif', 'Cooler Bag CB-16', 'Pengantaran last mile', 'Pembacaan terbaru', -4.8]
    ],
    history: makeTemperatureHistory('Cooler Bag CB-16', [-4.8, -4.9, -5.0, -4.6, -5.6], ['15:58', '15:30', '15:20', '13:45', '10:05']),
    route: { center: [-6.222, 106.876], completedIndex: 2, points: [['Kelapa Gading', -6.158, 106.906], ['Hub Jakarta Utara', -6.143, 106.891], ['Hub Tebet', -6.235, 106.856], ['Kawasan tujuan', -6.238, 106.852]] }
  },
  'ANT-FRZ-0009': {
    awb: 'ANT-FRZ-0009', stage: 'AT_HUB', status: 'Tiba di hub', statusClass: 'status-badge--hub',
    sender: 'C*** K******', recipient: 'A*** S******',
    origin: 'Kawasan Cibubur, Jakarta Timur', destination: 'Kawasan Kebayoran Baru, Jakarta Selatan',
    latestDescription: 'Paket telah diterima di hub transit untuk proses berikutnya.',
    lastAt: '2026-09-18T15:55:00+07:00', lastAtLabel: '18 Sep 2026 · 15.55 WIB',
    temperature: { asset: 'Hub freezer', code: 'HUB-FREEZER-09', value: -4.2, normalLow: -5, normalHigh: -2, nextAt: '16.55 WIB' },
    refreshCycle: [-4.0, -1.3, 0.8, -4.3],
    events: [
      ['Tiba di hub', 'Tiba di Hub Cawang', 'Paket diterima di cold storage untuk sortasi.', '2026-09-18T15:55:00+07:00', '18 Sep 2026 · 15.55 WIB'],
      ['Dalam perjalanan', 'Menuju Hub Cawang', 'Armada pendingin bergerak menuju hub transit.', '2026-09-18T14:20:00+07:00', '18 Sep 2026 · 14.20 WIB'],
      ['Paket diambil', 'Paket diambil dari pengirim', 'Kurir pickup Satria Candra A. telah memverifikasi segel.', '2026-09-18T12:10:00+07:00', '18 Sep 2026 · 12.10 WIB']
    ],
    pickup: { image: null, time: '18 Sep 2026 · 12.10 WIB', courier: 'Satria Candra A.', party: 'C*** K****** (pengirim)', note: 'Segel dan label pengiriman terverifikasi.', location: 'Kawasan Cibubur, Jakarta Timur' },
    delivery: null,
    segments: [
      ['Segmen 1', 'Selesai', 'Cooler Bag CB-09', 'Penjemputan awal', 'Pembacaan akhir', -5.0],
      ['Segmen 2', 'Aktif', 'Hub Freezer HF-09', 'Penyimpanan hub', 'Pembacaan terbaru', -4.2]
    ],
    history: makeTemperatureHistory('Hub Freezer HF-09', [-4.2, -4.4, -4.1, -4.7, -5.0], ['15:55', '15:30', '15:00', '14:30', '12:10']),
    route: { center: [-6.238, 106.85], completedIndex: 1, points: [['Cibubur', -6.355, 106.883], ['Hub Cawang', -6.245, 106.875], ['Hub Kebayoran', -6.244, 106.8], ['Kawasan tujuan', -6.242, 106.794]] }
  },
  'ANT-FRZ-0012': {
    awb: 'ANT-FRZ-0012', stage: 'DELIVERED', status: 'Terkirim', statusClass: 'status-badge--delivered',
    sender: 'PT P***** N********', recipient: 'S**** W******',
    origin: 'Kawasan Cakung, Jakarta Timur', destination: 'Kawasan Koja, Jakarta Utara',
    latestDescription: 'Diterima oleh penerima langsung. Dokumentasi tersedia.',
    lastAt: '2026-09-18T15:52:00+07:00', lastAtLabel: '18 Sep 2026 · 15.52 WIB',
    temperature: { asset: 'Cooler bag last mile', code: 'BAG-012', value: -5.0, normalLow: -8, normalHigh: -2, nextAt: null },
    refreshCycle: [],
    events: [
      ['Terkirim', 'Paket telah diterima', 'Delivery sukses oleh Satria Nanda R. Paket diterima langsung oleh S**** W****** dalam kondisi baik.', '2026-09-18T15:52:00+07:00', '18 Sep 2026 · 15.52 WIB', true],
      ['Sedang diantar', 'Kurir menuju kawasan penerima', 'Satria Nanda R. membawa paket menuju kawasan Koja.', '2026-09-18T14:46:00+07:00', '18 Sep 2026 · 14.46 WIB'],
      ['Keluar dari hub', 'Berangkat dari Hub Jakarta Utara', 'Paket diserahkan ke kurir last mile.', '2026-09-18T14:00:00+07:00', '18 Sep 2026 · 14.00 WIB'],
      ['Tiba di hub', 'Tiba di Hub Jakarta Utara', 'Paket disimpan pada freezer terpantau.', '2026-09-18T13:29:00+07:00', '18 Sep 2026 · 13.29 WIB'],
      ['Paket diambil', 'Paket diambil dari titik pickup', 'Kurir pickup Satria Ahmad F. menerima paket di kawasan Cakung.', '2026-09-18T12:33:00+07:00', '18 Sep 2026 · 12.33 WIB']
    ],
    pickup: { image: 'assets/images/evidence/ANT-FRZ-0012-pickup.webp', time: '18 Sep 2026 · 12.33 WIB', courier: 'Satria Ahmad F.', party: 'PT P***** N******** (pengirim)', note: 'Paket dan segel diterima dalam kondisi baik.', location: 'Kawasan Cakung, Jakarta Timur' },
    delivery: { image: 'assets/images/evidence/ANT-FRZ-0012-delivery.webp', time: '18 Sep 2026 · 15.52 WIB', courier: 'Satria Nanda R.', receiver: 'S**** W****** (penerima langsung)', note: 'Paket diterima dalam kondisi baik.' },
    segments: [
      ['Segmen 1', 'Selesai', 'Cooler Bag BAG-012', 'Penjemputan awal', 'Pembacaan akhir', -5.6],
      ['Segmen 2', 'Selesai', 'Hub Freezer JKT-UTR', 'Penyimpanan hub', 'Pembacaan akhir', -4.4],
      ['Segmen 3', 'Selesai', 'Mobil Boks BOX-06', 'Perjalanan antarhub', 'Pembacaan akhir', -5.2],
      ['Segmen 4', 'Selesai', 'Cooler Bag BAG-012', 'Pengantaran last mile', 'Pembacaan akhir', -5.0]
    ],
    history: makeTemperatureHistory('Cooler Bag BAG-012', [-5.0, -5.3, -5.2, -4.4, -5.6], ['15:52', '14:46', '14:00', '13:29', '12:33']),
    route: { center: [-6.14, 106.91], completedIndex: 3, points: [['Cakung', -6.174, 106.947], ['Hub Jakarta Utara', -6.13, 106.9], ['Pengantaran terakhir', -6.115, 106.912], ['Koja', -6.111, 106.92]] }
  },
  'ANT-FRZ-0014': {
    awb: 'ANT-FRZ-0014', stage: 'DELIVERED', status: 'Terkirim', statusClass: 'status-badge--delivered',
    sender: 'D**** F*** S*****', recipient: 'M***** R******',
    origin: 'Kawasan Palmerah, Jakarta Barat', destination: 'Kawasan Menteng, Jakarta Pusat',
    latestDescription: 'Diterima petugas keamanan dan ditempatkan di area penerimaan.',
    lastAt: '2026-09-18T16:02:00+07:00', lastAtLabel: '18 Sep 2026 · 16.02 WIB',
    temperature: { asset: 'Cooler bag last mile', code: 'BAG-014', value: -4.7, normalLow: -8, normalHigh: -2, nextAt: null },
    refreshCycle: [],
    events: [
      ['Terkirim', 'Paket diterima petugas keamanan', 'Satria Raka D. menyerahkan paket kepada Bapak A*** di area penerimaan.', '2026-09-18T16:02:00+07:00', '18 Sep 2026 · 16.02 WIB', true],
      ['Sedang diantar', 'Kurir menuju kawasan penerima', 'Paket dibawa menuju kawasan Menteng.', '2026-09-18T15:12:00+07:00', '18 Sep 2026 · 15.12 WIB'],
      ['Keluar dari hub', 'Berangkat dari Hub Jakarta Pusat', 'Paket diserahkan ke kurir last mile.', '2026-09-18T14:35:00+07:00', '18 Sep 2026 · 14.35 WIB'],
      ['Tiba di hub', 'Tiba di Hub Jakarta Pusat', 'Paket disimpan pada freezer terpantau.', '2026-09-18T13:10:00+07:00', '18 Sep 2026 · 13.10 WIB'],
      ['Paket diambil', 'Paket diambil dari titik pickup', 'Kurir pickup Satria Raka D. menerima paket.', '2026-09-18T10:20:00+07:00', '18 Sep 2026 · 10.20 WIB']
    ],
    pickup: { image: null, time: '18 Sep 2026 · 10.20 WIB', courier: 'Satria Raka D.', party: 'D**** F*** S***** (pengirim)', note: 'Paket diterima dalam kondisi baik.', location: 'Kawasan Palmerah, Jakarta Barat' },
    delivery: { image: null, time: '18 Sep 2026 · 16.02 WIB', courier: 'Satria Raka D.', receiver: 'Bapak A*** (petugas keamanan)', note: 'Ditempatkan di area penerimaan gedung.' },
    segments: [
      ['Segmen 1', 'Selesai', 'Cooler Bag BAG-014', 'Penjemputan awal', 'Pembacaan akhir', -5.1],
      ['Segmen 2', 'Selesai', 'Hub Freezer JKT-PST', 'Penyimpanan hub', 'Pembacaan akhir', -4.3],
      ['Segmen 3', 'Selesai', 'Cooler Bag BAG-014', 'Pengantaran last mile', 'Pembacaan akhir', -4.7]
    ],
    history: makeTemperatureHistory('Cooler Bag BAG-014', [-4.7, -4.8, -4.5, -4.3, -5.1], ['16:02', '15:30', '15:12', '13:10', '10:20']),
    route: { center: [-6.19, 106.81], completedIndex: 3, points: [['Palmerah', -6.19, 106.797], ['Hub Jakarta Pusat', -6.18, 106.83], ['Pengantaran terakhir', -6.185, 106.835], ['Menteng', -6.195, 106.84]] }
  }
};

export const findShipment = awb => SHIPMENTS[awb] ?? null;

export const normalizeAwb = value => value.trim().toUpperCase();

export const isValidAwb = value => /^ANT-FRZ-\d{4}$/.test(value);
