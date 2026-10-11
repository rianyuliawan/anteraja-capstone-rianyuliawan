# Anteraja Hub Dwell Monitor

Dashboard operasional untuk membandingkan waktu singgah paket di hub, menemukan lokasi dengan rata-rata dwell time tinggi, dan memilih titik awal investigasi. Aplikasi ini berdiri sendiri dari aplikasi pelacakan paket.

## Menjalankan aplikasi

Gunakan Node.js 20.19+ atau 22.12+.

```bash
cd hub-dwell-monitor
npm ci
npm run dev
```

Buka alamat lokal yang ditampilkan Vite. Data contoh sudah tersedia di `public/data/`; tidak dibutuhkan akun, database, maupun API key untuk menjalankan dashboard. Untuk memeriksa logika dan build produksi:

```bash
npm test
npm run build
```

Jika hasil analisis pada `bigdata-bottleneck-analysis/output/` berubah, jalankan `npm run data:build` untuk membuat ulang `public/data/metrics.json`.

## Alur data

`hub_dwell_summary.csv` menyediakan metrik per hub. `scan_pairs_dwell.csv` menyediakan pasangan ARRIVAL–DEPARTURE yang selesai dan menjadi dasar mean global. Skrip `scripts/build-metrics.mjs` memvalidasi jumlah pasangan per hub lalu menghasilkan `metrics.json`. React mengambil `metrics.json`, `locations.json`, dan `ai-summary.json` secara asinkron, menggabungkan hub berdasarkan `hub_id`, lalu menampilkan KPI, ranking, peta Leaflet, daftar, dan detail.

`locations.json` memakai titik representatif pusat kota untuk visualisasi hub; koordinatnya tidak menyatakan alamat fasilitas yang presisi. Ambang **lebih dari 6 jam** hanya aturan prioritas simulasi tugas, bukan SLA Anteraja. Ringkasan pada `ai-summary.json` disusun dari angka dataset, sedangkan empat skenario output terstruktur diuji secara terpisah di AI Studio dan dicatat dalam [dokumentasi tugas](docs/hub-dwell-monitor.md).

## Fitur

- Empat KPI global dan Top 3 hub berdasarkan mean numerik.
- Peta tujuh hub dengan penanda dan popup yang terhubung ke detail hub.
- Filter “Semua hub”/“Prioritas saja” yang sama untuk peta dan daftar.
- Pencarian daftar berdasarkan nama, kota, atau `hub_id`.
- Tampilan loading, empty, dan error; tata letak desktop dan seluler.

Dokumentasi sumber data, pengujian, rancangan, dan insight tersedia di [docs/hub-dwell-monitor.md](docs/hub-dwell-monitor.md).
