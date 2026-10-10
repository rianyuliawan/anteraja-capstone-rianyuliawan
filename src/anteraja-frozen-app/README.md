# Anteraja Frozen Tracking

Aplikasi pelacakan pengiriman produk beku dengan tampilan pelanggan berbasis React, REST API Laravel, PostgreSQL, cache Redis, dan simulasi pembacaan suhu dari Node-RED. Pelanggan dapat mencari nomor resi (AWB), melihat perjalanan paket, serta memeriksa pembacaan suhu dan foto pickup atau penerimaan.

> Proyek ini menggunakan data dan sensor **simulasi** untuk pengembangan capstone. Peta menunjukkan titik perjalanan, bukan posisi GPS paket secara langsung. Foto dalam dataset adalah ilustrasi, bukan bukti pengiriman nyata.

## Fitur

- Pencarian hingga 10 AWB dalam satu permintaan; hasil hanya menampilkan resi yang ditemukan.
- Detail status, linimasa, rute perjalanan, aset termal, dan penerima paket.
- Pembacaan suhu terbaru serta riwayat hingga delapan pembacaan per AWB.
- Foto pickup dan delivery melalui endpoint media privat.
- Simulasi Node-RED untuk aset aktif; data dikirim ke API internal dengan Bearer token.
- Cache Redis untuk pencarian dan detail, dengan invalidasi data suhu setelah pembacaan baru.

## Arsitektur

```text
Browser → React/Vite → REST API Laravel → PostgreSQL
                                 ↕
                               Redis
Node-RED → API internal Laravel → pembacaan aset dan snapshot suhu per AWB
```

React tidak mengakses database atau Node-RED secara langsung. Laravel menangani validasi, penyusunan respons, penyimpanan, dan akses foto. Tabel `shipment_asset_assignments` menghubungkan paket dengan aset pada periode tertentu; pembacaan aset yang relevan disimpan dalam `shipment_temperature_samples` agar riwayat paket tetap tersedia saat aset dipakai kembali.

| Bagian | Teknologi | Lokasi |
| --- | --- | --- |
| Antarmuka | React 19, Vite 8, Tailwind CSS 4, React Router | `frontend/` |
| API | PHP 8.3+, Laravel 13, Eloquent | `backend/` |
| Data | PostgreSQL dan Redis | dikonfigurasi di `backend/.env` |
| Simulasi suhu | Node-RED | `node-red/` |
| Data demo | SQL, 13 CSV, dan media WebP | `backend/database/dataset/` |

## Menjalankan secara lokal

Prasyarat: PHP 8.3+ dengan ekstensi PostgreSQL dan Redis, Composer, Node.js yang sesuai dengan Vite 8, PostgreSQL, Redis, npm, serta Node-RED CLI jika ingin menjalankan simulasi.

1. Siapkan backend dari `backend/`:

   ```bash
   composer install
   cp .env.example .env
   php artisan key:generate
   ```

   Atur `DB_*`, `CACHE_STORE=redis`, `REDIS_*`, dan `ANTERAJA_INGEST_TOKEN` dalam `.env`. Gunakan kredensial database milik Anda sendiri; jangan commit `.env`. Jika memakai PostgreSQL cloud, sesuaikan koneksi dan TLS menurut providernya.

2. **Hanya untuk database PostgreSQL baru yang kosong**, jalankan:

   ```bash
   php artisan migrate
   php artisan db:seed
   ```

   Seeder memuat 70 shipment, 316 event, 96 aset, 84 metadata foto, dan data suhu contoh. Seeder melewati impor bila shipment sudah ada. Jangan jalankan `migrate:fresh` pada database yang berisi data. Salin media demo dari `backend/database/dataset/media/shipment-events/` ke `backend/storage/app/private/shipment-events/` agar foto contoh dapat dibuka. Untuk database yang dipulihkan dari backup, pindahkan pula storage privat aslinya; metadata PostgreSQL saja tidak memuat byte foto.

3. Jalankan Laravel dari `backend/`:

   ```bash
   php artisan serve --host=127.0.0.1 --port=8093
   ```

4. Di terminal lain, jalankan frontend dari `frontend/`:

   ```bash
   npm ci
   npm run dev -- --host=127.0.0.1 --port=5195
   ```

   Buka `http://127.0.0.1:5195`. Contoh AWB: `ANT-FRZ-0012`. Proxy Vite meneruskan `/api` ke Laravel pada port 8093.

5. Opsional, jalankan simulasi dari folder aplikasi:

   ```bash
   bash node-red/start.sh
   ```

   Editor Node-RED berada di `http://127.0.0.1:1880`. Flow sumber disalin ke `node-red/runtime/` pada start pertama. Perubahan di editor tidak otomatis mengubah flow sumber. Jika Node-RED berhenti, aplikasi tetap menampilkan data terakhir, tetapi tidak menerima pembacaan simulasi baru.

## Endpoint utama

| Metode | URL | Keterangan |
| --- | --- | --- |
| GET | `/api/health` | Status API. |
| GET | `/api/shipments?awbs=AWB1,AWB2` | Pencarian maksimal 10 AWB. |
| GET | `/api/shipments/{awb}` | Detail pengiriman. |
| GET | `/api/shipments/{awb}/temperature-readings` | Riwayat suhu AWB. |
| GET | `/api/shipments/{awb}/media/{id}` | Foto terkait AWB yang diizinkan tampil. |
| GET | `/api/internal/thermal-assets` | Aset aktif; memerlukan Bearer token. |
| POST | `/api/internal/temperature-readings` | Penerimaan pembacaan simulasi; memerlukan Bearer token. |

Endpoint publik memiliki rate limit. Token internal dan kredensial PostgreSQL hanya berada di sisi server; jangan menaruhnya di React atau repository.

## Pengujian

```bash
# Dari backend/
php artisan test --compact
php artisan route:list --path=api --except-vendor

# Dari frontend/
npm run build
```

Saat memindahkan aplikasi ke server, pastikan backup PostgreSQL **dan** storage foto privat tersedia. Node-RED perlu dijalankan sebagai service tersendiri agar tetap hidup setelah SSH ditutup.
