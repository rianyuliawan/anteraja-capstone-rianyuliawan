# Persiapan VPS Anteraja Frozen

Ini adalah konfigurasi contoh untuk **satu VPS Ubuntu** dengan Nginx, PHP-FPM, PostgreSQL, Redis, React, dan Node-RED. Belum ada perubahan yang diterapkan pada VPS, Cloudflare, atau Supabase. Semua data di `backend/database/dataset/` adalah data demo; file foto di sana juga ilustratif.

## 1. Topologi dan kapasitas

```text
Browser --HTTPS--> Cloudflare --> Nginx :443 --> frontend/dist
                                      |--> /api/* --> Nginx 127.0.0.1:8080 --> PHP-FPM/Laravel
Node-RED 127.0.0.1:1880 --Bearer token--> Laravel 127.0.0.1:8080
Laravel --> PostgreSQL 127.0.0.1:5432 + Redis 127.0.0.1:6379
```

VPS 2 vCPU, RAM 4 GB, SSD 60 GB memadai untuk demo dan trafik kecil, **bukan jaminan** untuk trafik besar. Pantau RAM, CPU, ruang disk, koneksi PostgreSQL, dan log; siapkan swap 1–2 GB agar lonjakan memori tidak langsung mematikan proses. Jangan buka port 1880, 5432, 6379, atau 8080 ke internet. Node-RED “lokal” berarti lokal **di dalam VPS**, sehingga tetap berjalan saat laptop dimatikan. `systemd` menyalakan ulang proses setelah reboot atau crash. Tanpa Node-RED, data terakhir masih tampil, tetapi tidak ada pembacaan simulasi baru.

## 2. Paket dan kode

Pada Ubuntu, pasang Nginx, PHP 8.4 beserta ekstensi `pgsql`, `redis`, `mbstring`, `xml`, `curl`, `zip`, PHP-FPM, Composer, PostgreSQL, Redis, dan Node.js 24. Cocokkan versi PHP dengan `backend/composer.json` dan socket PHP-FPM di `nginx.conf.example`. Pasang Node-RED secara global untuk versi Node.js yang dipilih. Gunakan akun deploy biasa (contoh `anteraja`), bukan root, untuk menjalankan aplikasi dan Node-RED.

Tempatkan **folder ini saja** di `/srv/anteraja-frozen-app`. SQL, CSV, dan foto demo sudah disertakan di `backend/database/dataset/`; tidak perlu mengandalkan folder `docs/database` di luar aplikasi. Buat database dan role khusus aplikasi lewat `sudo -u postgres psql` (jangan gunakan superuser untuk Laravel):

```sql
CREATE ROLE anteraja_app LOGIN;
\password anteraja_app
CREATE DATABASE anteraja_frozen_app OWNER anteraja_app;
```

Perintah `\password` meminta kata sandi secara interaktif sehingga tidak perlu menuliskannya ke riwayat shell. Buat `.env` Laravel dari `.env.example` pada VPS, jangan salin `.env` lokal dan jangan commit rahasia. Isi `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://anteraja-capstone.rianyuliawan.my.id`, `DB_HOST=127.0.0.1`, `DB_DATABASE=anteraja_frozen_app`, `DB_USERNAME=anteraja_app`, `DB_PASSWORD` sesuai role tadi, `CACHE_STORE=redis`, `REDIS_HOST=127.0.0.1`, serta `ANTERAJA_INGEST_TOKEN` acak yang panjang. Jangan bawa `DB_SSLMODE=require` dari konfigurasi Supabase bila PostgreSQL lokal tidak memakai TLS; gunakan `prefer` atau konfigurasi lokal yang sesuai. Buat `APP_KEY` dengan `php artisan key:generate --force`. Pastikan `storage/` dan `bootstrap/cache/` bisa ditulis oleh PHP-FPM; folder kode lainnya cukup dibaca. Redis harus tetap bind di loopback dan tidak boleh diekspos ke publik.

```bash
cd /srv/anteraja-frozen-app/backend
composer install --no-dev --optimize-autoloader
php artisan key:generate --force
php artisan migrate --force
php artisan db:seed --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

cd /srv/anteraja-frozen-app/frontend
npm ci
npm run build
```

`migrate` dan `db:seed` di atas untuk **database PostgreSQL baru yang kosong**. Seeder melewati pengisian jika shipment sudah ada. Jangan memakai `migrate:fresh` pada database berisi data. Periksa jumlah data setelah seed: 70 shipment, 316 event, 84 metadata foto, dan maksimal 8 snapshot suhu per AWB. Untuk memindahkan data hidup dari Supabase, ambil *backup* terpisah lalu lakukan restore ke database VPS; **jangan seed ulang** di atas hasil restore. Catat cutover waktu, hentikan penulisan Node-RED sebelum ekspor final, lalu arahkan `.env` Laravel ke PostgreSQL VPS. Opsi lain ialah memakai dataset demo baru, tetapi itu tidak membawa pembacaan tambahan dari Supabase.

Foto disimpan sebagai berkas privat, bukan di PostgreSQL. Setelah menyiapkan data demo kosong, salin ke storage Laravel tanpa mempublikasikan folder media sumber lewat Nginx:

```bash
install -d /srv/anteraja-frozen-app/backend/storage/app/private/shipment-events
cp -a /srv/anteraja-frozen-app/backend/database/dataset/media/shipment-events/. /srv/anteraja-frozen-app/backend/storage/app/private/shipment-events/
```

Jika menggunakan backup data produksi, **salin juga storage privat aslinya**; jangan mengganti foto asli dengan ilustrasi demo. Pastikan pengguna PHP-FPM dapat membaca berkas itu.

## 3. Nginx, HTTPS, dan Cloudflare

Sesuaikan `nginx.conf.example` dengan jalur instalasi dan versi socket PHP-FPM, lalu pasang sebagai konfigurasi situs Nginx. Uji dengan `sudo nginx -t` sebelum reload. Server publik hanya menyajikan React dan `/api/*`; `/api/internal/*` ditutup dari internet, tetapi dapat diakses Node-RED dari port loopback 8080. `frontend/dist` perlu dibangun ulang setiap rilis. Urutan DNS/TLS yang aman:

1. Saat VPS sudah siap, buat record A `anteraja-capstone` menuju IPv4 VPS di Cloudflare dengan status **DNS only** sementara.
2. Uji situs HTTP, lalu terbitkan sertifikat origin publik, misalnya `sudo certbot --nginx -d anteraja-capstone.rianyuliawan.my.id`. Pastikan auto-renew berjalan dan URL HTTPS origin dapat dibuka.
3. Pilih mode SSL/TLS Cloudflare **Full (strict)**; jangan gunakan Flexible. Setelah konfigurasi IP pengunjung/firewall siap, aktifkan proxy Cloudflare bila diinginkan.

Cloudflare memerlukan sertifikat origin yang valid dan cocok dengan hostname untuk Full (strict); kalau belum ada, pengunjung bisa mendapat error 526. Gunakan TTL DNS yang sesuai agar perpindahan tidak terlalu lama.

Saat Cloudflare proxy aktif, pastikan Nginx memercayai `CF-Connecting-IP` **hanya dari jaringan IP Cloudflare yang resmi** sebelum memakai IP pengunjung untuk rate limit/log. Jangan percaya header tersebut dari semua alamat; pengunjung yang mengakses origin langsung dapat memalsukannya. IP range Cloudflare perlu diperbarui berkala. Sebelum aturan itu siap, rate limiter Laravel dapat melihat IP Cloudflare, bukan IP pengunjung asli. Batasi akses origin langsung lewat firewall Cloudflare IP ranges setelah HTTPS dan pengujian beres.

## 4. Node-RED privat yang otomatis hidup

`node-red/start.sh` tetap memakai port 8093 saat pengembangan. Untuk VPS, file `/etc/anteraja-frozen/node-red.env` (mode `0600`, pemilik akun service) harus berisi contoh berikut; nilai rahasia diisi sendiri, **bukan** literal contoh:

```ini
ANTERAJA_NODE_RED_MODE=production
ANTERAJA_API_BASE_URL=http://127.0.0.1:8080
NODE_RED_ADMIN_USERNAME=admin
NODE_RED_ADMIN_PASSWORD_HASH=<bcrypt-hasil-node-red-admin-hash-pw>
NODE_RED_CREDENTIAL_SECRET=<rahasia-acak-panjang>
```

`ANTERAJA_INGEST_TOKEN` dibaca dari `backend/.env`, atau dapat diberikan sebagai environment variable service. Hash password dibuat dengan `node-red admin hash-pw`; simpan hasilnya di file privat tersebut. `settings.production.js` membatasi editor ke `127.0.0.1` dan mewajibkan login. Pasang `anteraja-node-red.service.example` sebagai unit `systemd`, sesuaikan akun dan direktori, lalu `sudo systemctl daemon-reload`, `sudo systemctl enable --now anteraja-node-red`, dan cek `systemctl status anteraja-node-red` / `journalctl -u anteraja-node-red -n 100`. Untuk membuka editor dari laptop tanpa mengekspos port publik, gunakan SSH tunnel `ssh -L 1880:127.0.0.1:1880 akun@IP_VPS`, lalu buka `http://127.0.0.1:1880` di laptop.

Flow sumber `node-red/flows.json` disalin ke `node-red/runtime/flows.json` hanya pada start pertama. Deploy kode baru **tidak menimpa flow runtime** yang mungkin sudah diedit di editor. Jika hendak memperbarui flow, ekspor/cadangkan flow runtime, bandingkan dengan versi baru, lalu import melalui editor secara sadar. Jangan menghapus folder runtime tanpa cadangan.

## 5. Pemeriksaan sebelum DNS dan setelah rilis

- `php artisan migrate:status` menampilkan semua migration sudah berjalan; `php artisan db:show` dan query jumlah data membuktikan seed.
- `curl -i http://127.0.0.1:8080/api/health` di VPS menghasilkan 200; pencarian dan detail AWB contoh berfungsi.
- `curl -i http://127.0.0.1:1880` hanya bisa dari VPS/SSH tunnel; dari internet port 1880 tertutup.
- Node-RED mengirim satu pembacaan untuk aset aktif; cek baris baru di `temperature_readings` dan `shipment_temperature_samples`, lalu cek detail React tanpa refresh manual.
- Foto pickup/delivery AWB contoh membuka file privat; rute `/api/internal/*` dari domain publik mengembalikan 404.
- Uji halaman `/`, `/results`, `/tracking/ANT-FRZ-0012`, dan 404/route fallback melalui URL langsung setelah HTTPS.
- Buat backup PostgreSQL **dan** `backend/storage/app/private`; coba restore di lingkungan terpisah. Pantau disk, log, status service, dan kesehatan SSL.

Rujukan utama: [Laravel deployment](https://laravel.com/docs/deployment), [Node-RED security](https://nodered.org/docs/user-guide/runtime/securing-node-red), [Cloudflare Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/).
