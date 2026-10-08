# Latihan Google Maps — peta shipment dan kurir

Halaman [`shipment-map.html`](shipment-map.html) memplot enam lokasi contoh: lima paket dan satu kurir. Lima lokasi menggunakan koordinat dari array; satu paket (`ANT-FRZ-0014`) hanya memiliki alamat dan diubah menjadi koordinat melalui Geocoding API v4 lewat PHP lokal. Semua lokasi adalah **ilustrasi area/titik singgah**, bukan GPS langsung atau data operasional Anteraja.

## Yang dibuat

- Peta Google Maps berpusat di Jabodetabek, dengan marker berwarna merah muda untuk paket dan biru untuk kurir.
- Form **Cari lokasi dari alamat** menerima nama tempat/alamat. Setelah tombol ditekan, PHP meminta koordinat ke Geocoding API v4; hasilnya ditampilkan sebagai pin kuning, alamat hasil Google, dan lintang/bujur. Pencarian tidak memakai AWB dan tidak berjalan pada setiap ketikan agar penggunaan API lebih hemat.
- Array data pada `assets/shipments.js` di-loop untuk membuat marker dan daftar lokasi.
- Klik marker atau baris daftar membuka satu info window berisi resi/kode, status, dan lokasi.
- Geocoding alamat paket `ANT-FRZ-0014` dijalankan saat halaman dibuka: browser meminta `geocode.php?id=shipment-0014`, PHP meminta koordinat ke Google, lalu browser membuat marker keenam. Jika gagal, lima marker berkoordinat tetap dapat dipakai dan pesan kegagalan tampil.
- Tampilan mobile-first, navigasi keyboard, label peta, serta pesan ketika key atau layanan belum tersedia.

## Konfigurasi Google Maps API

1. Siapkan Google Maps API key yang dapat mengakses Maps JavaScript API dan Geocoding API v4 sesuai konfigurasi proyek Google Cloud Anda.
2. Salin `config.example.js` menjadi `config.local.js`, lalu isi `GOOGLE_MAPS_API_KEY`. Jangan kirim key lewat chat, screenshot, atau commit. File lokal tersebut sudah masuk `.gitignore`.
3. Proyek memanggil Geocoding API v4 melalui PHP lokal, bukan dari JavaScript browser.

Untuk latihan lokal, `start-local.sh` memakai key yang sama pada browser dan PHP. **Konfigurasi ini belum sesuai untuk produksi:** key browser tetap terlihat di DevTools. Bila aplikasi diterbitkan, gunakan key browser yang dibatasi berdasarkan website dan API, serta key server tersendiri yang dilindungi di environment/secret manager. Jangan menganggap file `config.local.js` menyembunyikan key dari pengunjung web.

## Pemeriksaan lokal

Jalankan server PHP dari folder `src/geolocation-map`:

```bash
bash start-local.sh
```

Buka `http://127.0.0.1:8092/shipment-map.html`. Bila port 8092 masih dipakai server lama, hentikan server itu atau jalankan `bash start-local.sh 8093` dan buka port 8093. **Server Python/Live Server tidak menjalankan PHP**, sehingga geocoding hanya bekerja lewat server PHP. Cek enam marker, lalu coba cari nama lokasi pada form untuk melihat pin kuning dan koordinatnya. Jika gagal, lihat respons `geocode.php` pada Network browser serta periksa konfigurasi dan kuota API. Header khusus pada pencarian hanya membantu membatasi permintaan dari browser lain; bila kelak dipublikasikan, tambahkan autentikasi dan rate limit di backend.

## Struktur

```text
src/geolocation-map/
├── shipment-map.html       # Struktur halaman
├── config.example.js       # Contoh konfigurasi tanpa key asli
├── config.local.js         # Key lokal; diabaikan Git
├── start-local.sh           # Menjalankan server PHP untuk demo lokal
├── geocode.php              # Proxy Geocoding API v4 untuk contoh dan pencarian lokasi
└── assets/
    ├── styles.css          # CSS responsif
    ├── shipments.js        # Data dummy
    └── map.js              # Loader Google Maps, marker, info window, fetch koordinat
```

Latihan ini tidak mengubah peta Leaflet pada aplikasi React utama.
