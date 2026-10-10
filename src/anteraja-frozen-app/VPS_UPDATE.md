# Memperbarui Anteraja Frozen App di VPS

Panduan ini untuk VPS Ubuntu yang sudah menjalankan aplikasi dari branch
`feature/anteraja-frozen-app` di `/srv/anteraja/repo`, dengan PostgreSQL lokal,
Redis, Nginx, PHP 8.4-FPM, dan Node-RED terpasang. Jalankan perintah berikut
melalui SSH sebagai pengguna `rian`. Jangan tempel password atau token ke chat,
Git, maupun riwayat perintah shell.

## 1. Cadangkan database dan periksa Git

```bash
sudo install -d -o postgres -g postgres -m 0700 /srv/anteraja/backups
sudo -u postgres pg_dump -Fc -f "/srv/anteraja/backups/anteraja-frozen-$(date +%Y%m%d-%H%M%S).dump" anteraja_frozen_app
cd /srv/anteraja/repo
git branch --show-current
git status --short
```

Branch harus `feature/anteraja-frozen-app` dan `git status --short` sebaiknya
kosong. Jika ada perubahan lokal, berhenti dan periksa dulu; jangan gunakan
`git reset --hard`. Cadangkan juga `backend/storage/app/private/shipment-events`
bila foto di VPS telah diubah. Backup PostgreSQL tidak berisi byte foto.

## 2. Tarik kode dan perbarui Laravel + React

Hentikan service Node-RED lebih dulu **jika service itu sudah pernah dibuat**:

```bash
sudo systemctl status anteraja-node-red --no-pager
sudo systemctl stop anteraja-node-red
```

Jika unit belum ada, abaikan dua perintah tersebut. Lanjutkan:

```bash
cd /srv/anteraja/repo
git fetch origin
git pull --ff-only origin feature/anteraja-frozen-app
cd src/anteraja-frozen-app/backend
php8.4 /usr/bin/composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
php8.4 artisan optimize:clear
php8.4 artisan migrate --force
php8.4 artisan temperature:rebuild-demo
php8.4 artisan optimize
cd ../frontend
npm ci
npm run build
sudo systemctl reload php8.4-fpm
sudo systemctl reload nginx
```

Pada database VPS yang **sudah berisi 70 paket**, jangan jalankan
`migrate:fresh` atau `db:seed`. Migrasi menambah kolom waktu serah-terima dan
menit jadwal tiap aset. Perintah `temperature:rebuild-demo` mengganti hanya
pembacaan dan cuplikan ber-sumber `SEED` dengan jadwal per jam masing-masing
aset. Pembacaan `NODE_RED` yang sudah tersimpan tidak dihapus. Untuk database
yang benar-benar baru dan kosong, gunakan `php8.4 artisan migrate --force`
diikuti `php8.4 artisan db:seed --force`; seeder baru langsung membentuk data
suhu per jam.

Periksa API dan situs sebelum memulai simulasi:

```bash
curl -i -H 'Host: anteraja-capstone.rianyuliawan.my.id' http://127.0.0.1/api/health
curl -I https://anteraja-capstone.rianyuliawan.my.id/
```

## 3. Siapkan Node-RED privat yang tetap hidup setelah SSH ditutup

`node-red/settings.production.js` membatasi editor ke `127.0.0.1:1880` dan
memerlukan login. Jangan membuka port 1880 di firewall atau mempublikasikannya
melalui Nginx. Di VPS, jalankan `node-red admin hash-pw` dan masukkan password
admin pilihan Anda **langsung di terminal VPS**. Simpan hash bcrypt yang
ditampilkan. Buat juga secret acak dengan `openssl rand -hex 32`.

Buat berkas lingkungan privat:

```bash
sudo install -d -m 0700 /etc/anteraja
sudoedit /etc/anteraja/node-red.env
sudo chmod 600 /etc/anteraja/node-red.env
```

Isi berkas tersebut dengan nilai milik Anda sendiri, tanpa tanda kurung sudut:

```text
NODE_RED_CREDENTIAL_SECRET=<hasil openssl rand -hex 32>
NODE_RED_ADMIN_USERNAME=admin
NODE_RED_ADMIN_PASSWORD_HASH=<hasil node-red admin hash-pw>
```

Token ingest **tidak** perlu disalin ke berkas ini. `node-red/start.sh`
membaca `ANTERAJA_INGEST_TOKEN` dari `backend/.env` yang sudah digunakan
Laravel. Pastikan pengguna `rian` dapat membaca berkas itu. Nilai
`ANTERAJA_API_BASE_URL` di service berikut menunjuk ke Nginx lokal, bukan ke
alamat publik.

Buat unit dengan `sudoedit /etc/systemd/system/anteraja-node-red.service`:

```ini
[Unit]
Description=Anteraja Frozen Node-RED simulator
Wants=network-online.target
After=network-online.target nginx.service php8.4-fpm.service

[Service]
Type=simple
User=rian
WorkingDirectory=/srv/anteraja/repo/src/anteraja-frozen-app
Environment=ANTERAJA_NODE_RED_MODE=production
Environment=ANTERAJA_API_BASE_URL=http://127.0.0.1:8080
EnvironmentFile=/etc/anteraja/node-red.env
ExecStart=/usr/bin/bash /srv/anteraja/repo/src/anteraja-frozen-app/node-red/start.sh
Restart=always
RestartSec=10
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Sebelum memulai service, periksa flow runtime. Saat pertama kali dijalankan,
`start.sh` menyalin `node-red/flows.json` ke `node-red/runtime/flows.json`.
Jika runtime sudah ada, skrip **tidak menimpanya**. Bandingkan kedua berkas:

```bash
cd /srv/anteraja/repo/src/anteraja-frozen-app
test ! -f node-red/runtime/flows.json || cmp node-red/flows.json node-red/runtime/flows.json
```

Jika berbeda karena Anda pernah mengedit flow lewat editor, ekspor atau
cadangkan perubahan itu dulu. Jika ingin memakai flow dari GitHub, buat
salinan `node-red/runtime/flows.json` lalu salin `node-red/flows.json` ke
runtime saat service berhenti. Jangan mengganti seluruh folder `runtime/`:
di sana ada konfigurasi dan kemungkinan kredensial lokal.

Aktifkan service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now anteraja-node-red
sudo systemctl status anteraja-node-red --no-pager
sudo journalctl -u anteraja-node-red -n 80 --no-pager
sudo ss -ltnp | grep ':1880'
```

Node-RED harus berstatus `active` dan mendengarkan hanya di `127.0.0.1:1880`.
Service systemd akan tetap berjalan setelah sesi SSH ditutup dan aktif lagi
sesudah VPS reboot. Untuk membuka editor dari laptop tanpa membuka port publik:

```bash
ssh -L 1880:127.0.0.1:1880 rian@103.117.56.239
```

Lalu buka `http://127.0.0.1:1880` di laptop. Gunakan login admin yang hash-nya
disiapkan di VPS.

## 4. Memeriksa dua jenis data suhu

Flow memeriksa jadwal setiap menit, tetapi tiap aset hanya dijadwalkan sekali
per jam pada menit `thermal_assets.reading_minute` miliknya. Paket `DELIVERED`
mempertahankan cuplikan suhu demo sampai waktu pengiriman selesai. Paket yang
masih aktif menerima pembacaan Node-RED bila asetnya sedang ditugaskan ke AWB;
React mengambil ulang detail paket aktif secara berkala selama tab terlihat.
Karena itu beberapa menit pertama setelah service menyala mungkin belum ada
data Node-RED baru untuk aset yang sedang Anda lihat.

```bash
sudo -u postgres psql -d anteraja_frozen_app -c "SELECT source, count(*) AS jumlah, max(observed_at AT TIME ZONE 'Asia/Jakarta') AS terakhir_wib FROM temperature_readings GROUP BY source ORDER BY source;"
sudo -u postgres psql -d anteraja_frozen_app -c "SELECT asset_code, reading_minute FROM thermal_assets WHERE asset_code IN ('BAG-002','BOX-02') ORDER BY asset_code;"
```

Jangan menganggap waktu serah-terima aset sebagai pembacaan sensor baru:
`associated_at` adalah waktu bacaan dikaitkan ke paket, sedangkan
`observed_at` tetap waktu sensor membaca. Situs pelanggan hanya menampilkan
suhu terakhir dan statistik ringkas; daftar riwayat tetap ada di database
untuk pemeriksaan internal.
