# Day 13 — Laravel CRUD kurir dan pengiriman

Latihan ini dibuat **terpisah** dari aplikasi `anteraja-frozen-api` dan `anteraja-frozen-tracking` yang menjadi target akhir proyek. Backend dibuat dari instalasi Laravel baru; frontend adalah salinan React yang sudah dibuat, lalu ditambah halaman **Kelola Data**. Database yang digunakan adalah PostgreSQL **lokal** bernama `anteraja_day13_local`, bukan Aiven.

Sesuai keputusan proyek, antarmuka CRUD dibuat dengan React, **bukan Blade**. Jadi kriteria tugas yang secara khusus meminta view Blade `@foreach/@if` tidak diklaim terpenuhi. Pengulangan daftar di React memakai `.map()`; seluruh data berasal dari API Laravel/Eloquent, bukan HTML statis.

## Alur dan struktur

```text
React (Vite, :5195) ── /api proxy ──▶ Laravel (:8093) ── Eloquent ──▶ PostgreSQL lokal
Node-RED (:1880) ── Bearer token ──▶ Laravel /api/internal ──────────▶ PostgreSQL lokal
```

| Folder | Isi |
| --- | --- |
| `backend/` | Laravel baru: migration, model, controller, seeder, API, feature test. |
| `frontend/` | Salinan UI pelacakan React, ditambah halaman `/admin` untuk CRUD. |
| `node-red/` | Salinan flow simulator yang sudah ada; runtime lokal diabaikan Git. |

Migration `2026_10_04_000001_create_day13_tables.php` membuat empat tabel:

- `couriers`: kode unik, nama, rating, status aktif.
- `shipments`: AWB unik, pengirim/penerima, asal/tujuan, berat, status, `courier_id` dan `thermal_asset_id`.
- `thermal_assets`: aset dan ambang suhu untuk simulasi.
- `temperature_readings`: pembacaan per aset, sumber dan `message_id` unik untuk mencegah duplikasi.

Relasi Eloquent: satu `Courier` mempunyai banyak `Shipment`; satu `Shipment` dimiliki satu `Courier` dan boleh terkait satu `ThermalAsset`. Satu aset mempunyai banyak pembacaan suhu. Kurir yang masih digunakan pengiriman tidak dapat dihapus (respons 409 dan foreign key `RESTRICT`). Suhu berasal dari aset; beberapa paket pada aset yang sama dapat melihat pembacaan yang sama. Ini adalah penyederhanaan untuk latihan Day 13, **bukan** skema perjalanan aset berbasis periode pada proyek utama.

Seeder memberi 4 kurir, 12 pengiriman dengan empat status berbeda, dan 7 aset. Nomor contoh `ANT-FRZ-0002` untuk paket dalam perjalanan dan `ANT-FRZ-0012` untuk paket terkirim.

## Menjalankan lokal

Pastikan PostgreSQL lokal hidup dan database kosong `anteraja_day13_local` dimiliki pengguna `rian`. Jangan memakai database `anteraja_frozen_dev` atau Aiven untuk latihan ini. Pada mesin ini koneksi PostgreSQL memakai Unix socket/peer authentication (`DB_HOST=/var/run/postgresql`) tanpa menyimpan kata sandi.

Terminal 1:

```bash
cd src/anteraja-day13-laravel-crud/backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8093
```

Jika `.env` sudah tersedia, jangan menimpanya dengan `cp`. Pastikan `DB_CONNECTION=pgsql`, `DB_DATABASE=anteraja_day13_local`, `DB_USERNAME=rian`, dan `DB_HOST=/var/run/postgresql`. Seeder idempoten untuk data contoh; data baru yang dibuat dari UI tidak dihapus. Jangan menjalankan `migrate:fresh` pada database yang telah diisi pengguna.

Terminal 2:

```bash
cd src/anteraja-day13-laravel-crud/frontend
npm ci
npm run dev -- --host=127.0.0.1 --port=5195
```

Buka `http://127.0.0.1:5195/admin` untuk CRUD dan `http://127.0.0.1:5195/` untuk pencarian AWB. Halaman detail memakai `/tracking/ANT-FRZ-0002`. Header dan tampilan dasar memakai komponen React yang disalin dari proyek sebelumnya.

Terminal 3, opsional untuk suhu:

```bash
cd src/anteraja-day13-laravel-crud
bash node-red/start.sh
```

Editor simulator ada di `http://127.0.0.1:1880`. Flow yang sama mengambil daftar aset dari Laravel, mengirim suhu awal saat dijalankan, lalu setiap 60 menit; tombol manual dapat menguji Normal/Peringatan/Kritis. Runtime Node-RED terpisah dari flow proyek utama. Port 1880 hanya bisa dipakai satu proses Node-RED pada satu waktu. Token dibaca dari `backend/.env`, tidak disimpan dalam file flow atau dikirim ke browser. `ANTERAJA_INGEST_TOKEN` dalam `.env.example` adalah placeholder; ganti sebelum menjalankan di luar laptop pribadi.

## Endpoint yang dikerjakan

| Method | Path | Fungsi |
| --- | --- | --- |
| GET/POST | `/api/couriers` | Daftar/tambah kurir. |
| GET/PUT/DELETE | `/api/couriers/{id}` | Detail/ubah/hapus kurir. |
| GET/POST | `/api/admin/shipments` | Daftar/tambah pengiriman. |
| GET/PUT/DELETE | `/api/admin/shipments/{id}` | Detail/ubah/hapus pengiriman. |
| GET | `/api/shipments?awbs=...` | Cari resi dari React. |
| GET | `/api/shipments/{awb}` | Detail pelacakan dari React. |
| GET | `/api/shipments/{awb}/temperature-readings` | Riwayat suhu aset. |
| GET/POST | `/api/internal/thermal-assets`, `/api/internal/temperature-readings` | Integrasi Node-RED; wajib Bearer token. |

CRUD API pada latihan ini **belum memakai login/otorisasi**. Jalankan hanya di `127.0.0.1`; jangan publikasikan panel admin apa adanya. Validasi server meliputi AWB unik, rating 0–5, berat positif, status yang diizinkan, dan foreign key kurir/aset. `DELETE` pada pengiriman menghapus satu data yang dipilih; data seed lain tidak berubah.

## Pengujian yang dilakukan

- `php artisan migrate --force` dan `php artisan db:seed --force`: tabel berhasil dibuat; 4 kurir, 12 pengiriman, 7 aset terisi di PostgreSQL lokal.
- `DB_CONNECTION=sqlite DB_DATABASE=:memory: php artisan test --filter=Day13ApiTest`: 2 tes, 30 assertion lulus. Pengujian ini memakai DB sementara di memori, sehingga tidak menghapus data lokal.
- Tes API mencakup Create/Read/Update/Delete kurir dan pengiriman, relasi Eloquent, validasi, larangan hapus kurir yang masih dipakai, pencarian AWB, serta token dan deduplikasi telemetri.
- `npm run build`: frontend React berhasil dibangun. Browser menampilkan 4 kurir dan 12 pengiriman di `/admin`, serta suhu Node-RED di detail `ANT-FRZ-0002`.
- Node-RED mengirim 7 pembacaan untuk 7 aset ke PostgreSQL lokal; waktu UTC disimpan dan ditampilkan sebagai WIB dengan benar.

Tiga commit modular sudah dibuat secara lokal pada branch `feature/laravel-crud`. Belum ada push, Pull Request, review partner, atau merge; langkah kolaborasi Git tersebut menunggu peninjauan Anda.
