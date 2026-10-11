# Anteraja Frozen Tracking

Aplikasi pelacakan pengiriman produk beku dengan tampilan pelanggan berbasis React, REST API Laravel, PostgreSQL, cache Redis, dan simulasi pembacaan suhu dari Node-RED. Pelanggan dapat mencari nomor resi (AWB), melihat perjalanan paket, serta memeriksa pembacaan suhu dan foto pickup atau penerimaan.

> Proyek ini menggunakan data dan sensor **simulasi** untuk pengembangan capstone. Peta menunjukkan titik perjalanan, bukan posisi GPS paket secara langsung. Foto dalam dataset adalah ilustrasi, bukan bukti pengiriman nyata.

## Fitur

- Pencarian hingga 10 AWB dalam satu permintaan; hasil hanya menampilkan resi yang ditemukan.
- Detail status, linimasa, rute perjalanan, aset termal, dan penerima paket.
- Pembacaan suhu aset terbaru dan ringkasan jumlah, suhu minimum, rata-rata, serta maksimum.
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

| Bagian        | Teknologi                                      | Lokasi                          |
| ------------- | ---------------------------------------------- | ------------------------------- |
| Antarmuka     | React 19, Vite 8, Tailwind CSS 4, React Router | `frontend/`                     |
| API           | PHP 8.4+, Laravel 13, Eloquent                 | `backend/`                      |
| Data          | PostgreSQL dan Redis                           | dikonfigurasi di `backend/.env` |
| Simulasi suhu | Node-RED                                       | `node-red/`                     |
| Data demo     | SQL, 13 CSV, dan media WebP                    | `backend/database/dataset/`     |

## Kebutuhan

- PHP 8.4+ dengan ekstensi PostgreSQL (`pdo_pgsql`) dan Redis (`phpredis`), serta Composer.
- PostgreSQL 15+ dan Redis.
- Node.js `^20.19.0` atau `>=22.12.0`, serta npm.
- Node-RED CLI untuk simulasi suhu (opsional).

Perintah di bawah dijalankan dari folder `src/anteraja-frozen-app/`, kecuali jika tertulis lain. Tiga proses aplikasi (Laravel, React, dan Node-RED) menggunakan terminal terpisah.

## Persiapan pertama kali

1. Nyalakan PostgreSQL dan Redis, lalu buat database PostgreSQL kosong bernama `anteraja_frozen_app`. Akun PostgreSQL yang digunakan harus memiliki izin membuat tabel dan skema. Di Ubuntu, layanan dapat dinyalakan dengan:

   ```bash
   sudo systemctl start postgresql redis-server
   pg_isready
   redis-cli ping
   ```

   `redis-cli ping` seharusnya mengembalikan `PONG`.

2. Siapkan Laravel:

   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   ```

   Jika `.env` sudah ada, jangan salin ulang agar konfigurasi lama tidak tertimpa. Sesuaikan `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, dan `DB_PASSWORD` di `backend/.env` dengan PostgreSQL Anda. Pertahankan `CACHE_STORE=redis`, sesuaikan `REDIS_*` jika perlu, dan ganti `ANTERAJA_INGEST_TOKEN` dengan token acak milik Anda. File `.env` berisi kredensial; jangan commit ke Git.

3. Untuk database yang **masih kosong**, buat skema dan isi data demo:

   ```bash
   php artisan migrate
   php artisan db:seed
   mkdir -p storage/app/private/shipment-events
   cp -a database/dataset/media/shipment-events/. storage/app/private/shipment-events/
   ```

   Seeder memuat 70 paket, 316 kejadian, 96 aset termal, metadata foto, dan pembacaan suhu simulasi. Perintah salin foto hanya untuk menyiapkan dataset demo baru. Jika database sudah berisi paket, cukup jalankan migration yang belum terpasang; seeder tidak akan menimpa paket yang ada. Jangan gunakan `migrate:fresh` pada database yang ingin dipertahankan.

4. Siapkan dependensi frontend:

   ```bash
   cd ../frontend
   npm ci
   ```

## Menjalankan layanan

Setelah persiapan selesai, jalankan perintah berikut di terminal yang berbeda:

| Terminal            | Folder          | Perintah                                         | Alamat                  |
| ------------------- | --------------- | ------------------------------------------------ | ----------------------- |
| Laravel API         | `backend/`      | `php artisan serve --host=127.0.0.1 --port=8093` | `http://127.0.0.1:8093` |
| React               | `frontend/`     | `npm run dev -- --host=127.0.0.1 --port=5195`    | `http://127.0.0.1:5195` |
| Node-RED (opsional) | folder aplikasi | `bash node-red/start.sh`                         | `http://127.0.0.1:1880` |

Instal Node-RED CLI terlebih dahulu jika perintah `node-red` belum tersedia. Skrip `node-red/start.sh` membaca token dari `backend/.env` dan mengirim data ke Laravel pada port 8093. Saat pertama dijalankan, skrip menyalin flow sumber ke `node-red/runtime/`; perubahan flow di editor tersimpan di runtime dan tidak otomatis mengubah flow sumber.

Frontend meneruskan permintaan `/api` ke Laravel melalui proxy Vite. Node-RED tidak wajib untuk membuka web: tanpa Node-RED, pembacaan suhu terakhir tetap dapat dilihat, tetapi tidak ada pembacaan simulasi baru.

## Pemeriksaan cepat

1. Buka `http://127.0.0.1:5195` dan cari `ANT-FRZ-0012`.
2. Buka detailnya; status, peta, suhu, dan foto contoh seharusnya tampil.
3. Periksa API dengan `curl http://127.0.0.1:8093/api/health` (hasil yang diharapkan: `{"status":"ok"}`).

## Jadwal dan ringkasan suhu

Setiap aset mempunyai `thermal_assets.reading_minute` (0–59). Simulator memeriksa jadwal setiap menit dan mengirim hanya aset aktif yang jatuh tempo; jadi setiap aset aktif dibaca satu kali per jam, tetapi tidak harus pada menit yang sama. Tombol uji manual di Node-RED dapat menambah pembacaan di luar jadwal.

Seeder membuat bacaan **simulasi** dengan interval satu jam per aset. Satu bacaan aset dapat dipakai oleh beberapa paket yang sedang berada di dalamnya. Pada serah-terima, suhu terakhir aset tujuan dikaitkan ke paket. `observed_at` tetap waktu sensor membaca; `associated_at` adalah waktu bacaan dikaitkan karena paket masuk ke aset tersebut. Misalnya paket masuk pukul 13.25 dan aset terakhir membaca pukul 13.10: paket mendapat suhu terakhir aset tersebut tanpa membuat bacaan sensor baru. Tidak ada bacaan baru yang dibuat setelah paket terkirim. Antarmuka pelanggan hanya menampilkan suhu terbaru dan statistik ringkas, bukan daftar riwayat. Cuplikan per paket tetap disimpan di database untuk agregasi dan audit; paket aktif dibatasi delapan cuplikan.

Pada database demo yang sudah pernah diisi, jalankan `php artisan migrate` untuk memasang migration baru. Jika ingin menyusun ulang jadwal contoh per aset, jalankan `php artisan temperature:rebuild-demo` dari `backend/`. Perintah ini hanya mengganti pembacaan bersumber `SEED`; pembacaan Node-RED tidak dihapus.

## Pengujian

```bash
# Dari backend/
php artisan test
php artisan route:list --path=api --except-vendor

# Dari frontend/
npm run lint
npm run build
```
