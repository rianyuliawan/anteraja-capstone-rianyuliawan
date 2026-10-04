# Anteraja Frozen App

Aplikasi pelacakan paket beku ini menggabungkan frontend React, API Laravel, PostgreSQL lokal, dan simulator suhu Node-RED. Antarmuka pelanggan menampilkan hasil pencarian AWB, status dan linimasa, perjalanan aset, riwayat suhu, serta bukti foto pickup/delivery. Ini adalah fondasi lokal proyek; folder `anteraja-frozen-tracking` dan `anteraja-frozen-api` sebelumnya tetap disimpan terpisah sebagai referensi.

## Pekerjaan yang dibuat

Pada tugas Laravel ini, saya menyiapkan backend baru dan menghubungkannya dengan antarmuka React yang sudah dibuat. Saya membuat migration untuk struktur data pengiriman, model Eloquent untuk membaca shipment, aset, dan riwayat suhu, serta seeder yang mengimpor dataset contoh dari CSV. API Laravel menyediakan pencarian resi, detail pengiriman, riwayat suhu, dan foto bukti. Endpoint internal menerima pembacaan suhu simulasi dari Node-RED. Saya memeriksa hasilnya melalui tampilan React dan pengujian API Laravel.

## Alur data

```text
React (:5195) ── GET /api ──▶ Laravel (:8093) ── Eloquent/SQL ──▶ PostgreSQL
Node-RED (:1880) ── token + POST /api/internal ──▶ Laravel ──▶ temperature_readings
Foto WebP privat ──▶ endpoint media Laravel ──▶ React
```

Data suhu melekat pada aset termal, kemudian dikaitkan ke shipment berdasarkan rentang waktu pada `shipment_asset_assignments`. PostgreSQL menyimpan metadata foto dan kunci berkas; file WebP berada di `backend/storage/app/private/shipment-events`.

## Struktur

| Lokasi | Isi |
| --- | --- |
| `frontend/` | React, Vite, halaman beranda/hasil/detail, dan komponen UI. |
| `backend/app/Models/Dataset/` | Model Eloquent untuk tabel dan view pelacakan. |
| `backend/app/Http/Controllers/Api/` | Endpoint pelacakan, foto, dan penerimaan telemetri. |
| `backend/app/Services/` | Penyusunan detail pengiriman dan validasi/penyimpanan suhu. |
| `backend/database/migrations/` | Tabel framework Laravel dan skema pelacakan PostgreSQL. |
| `backend/database/seeders/` | Impor 12 CSV proyek ke skema ternormalisasi. |
| `node-red/` | Flow simulasi aset aktif untuk demo lokal. |
| `../../docs/database/` | SQL, CSV, dan sumber gambar dataset. |

Seeder awal memuat 70 shipment, 4 kurir, 86 aset termal, 274 event, 400 pembacaan suhu, dan 84 metadata foto. Pembacaan Node-RED berikutnya menambah riwayat tanpa mengubah data seed. Seeder melewati impor jika shipment sudah ada; jangan memakai `migrate:fresh` pada database berisi data.

## Menjalankan lokal

Pastikan PostgreSQL lokal dan database aplikasi tersedia, serta PHP/Composer, Node.js, dan Node-RED terpasang. Dari akar repository:

```bash
cd src/anteraja-frozen-app/backend
composer install
```

Jika `.env` belum ada, salin `.env.example`, jalankan `php artisan key:generate`, dan isi koneksi PostgreSQL sesuai lingkungan lokal. Simpan token internal hanya dalam `.env`, jangan commit atau kirim ke browser.

```bash
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8093
```

Pada instalasi baru, salin sumber foto dari `docs/database/sample-data/media/shipment-events` ke `backend/storage/app/private/shipment-events` agar endpoint bukti dapat menampilkan gambar. Migration dan seeder hanya mengelola tabel dan metadata foto, bukan byte gambar.

Terminal lain:

```bash
cd src/anteraja-frozen-app/frontend
npm ci
npm run dev -- --host=127.0.0.1 --port=5195
```

Buka `http://127.0.0.1:5195/`. Contoh resi terkirim: `ANT-FRZ-0012`. Untuk simulasi suhu, dari `src/anteraja-frozen-app` jalankan `bash node-red/start.sh`; editor Node-RED ada di `http://127.0.0.1:1880`. Hanya satu proses boleh memakai port 1880 pada satu waktu.

## Endpoint

| Metode | Rute | Fungsi |
| --- | --- | --- |
| GET | `/api/health` | Status API. |
| GET | `/api/shipments?awbs=A,B` | Cari hingga 10 resi; respons hanya memuat yang ditemukan. |
| GET | `/api/shipments/{awb}` | Detail status, linimasa, rute, aset, suhu, dan bukti. |
| GET | `/api/shipments/{awb}/temperature-readings` | Riwayat pembacaan suhu yang terkait AWB. |
| GET | `/api/shipments/{awb}/media/{id}` | Berkas WebP privat yang terkait AWB. |
| GET | `/api/internal/thermal-assets` | Daftar aset aktif untuk Node-RED; perlu Bearer token. |
| POST | `/api/internal/temperature-readings` | Terima pembacaan Node-RED; perlu Bearer token. |

Frontend tidak terhubung langsung ke PostgreSQL atau Node-RED. Node-RED meminta daftar aset, membangkitkan suhu simulasi, lalu mengirimnya ke API Laravel. Laravel memvalidasi kode aset, suhu, waktu, dan `message_id` sebelum menyimpan. Detail React mengambil data terbaru dari API selama halaman aktif. Belum ada panel admin, login, atau Redis di fondasi ini.

## Pemeriksaan

```bash
cd src/anteraja-frozen-app/backend
php artisan test --compact
php artisan route:list --path=api --except-vendor
```

Tes otomatis memeriksa validasi pencarian dan perlindungan endpoint internal tanpa mengubah database lokal. Detail `ANT-FRZ-0012`, riwayat suhu, dan foto pickup/delivery telah diperiksa pada PostgreSQL lokal. Build frontend diperiksa dengan `npm run build`. Semua angka performa lokal bergantung pada mesin dan keadaan server; bukan jaminan produksi.
