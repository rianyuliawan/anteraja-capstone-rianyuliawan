# Latihan Google Maps — peta shipment dan kurir

Halaman [`shipment-map.html`](shipment-map.html) memplot enam lokasi contoh: lima paket dan satu kurir. Lima lokasi menggunakan koordinat dari array; satu paket (`ANT-FRZ-0014`) hanya memiliki alamat dan diubah menjadi koordinat melalui layanan geocoding Google Maps JavaScript API. Semua lokasi adalah **ilustrasi area/titik singgah**, bukan GPS langsung atau data operasional Anteraja.

## Yang dibuat

- Peta Google Maps berpusat di Jabodetabek, dengan marker berwarna merah muda untuk paket dan biru untuk kurir.
- Array data pada `assets/shipments.js` di-loop untuk membuat marker dan daftar lokasi.
- Klik marker atau baris daftar membuka satu info window berisi resi/kode, status, dan lokasi.
- Geocoding alamat paket `ANT-FRZ-0014` dijalankan sekali saat halaman dibuka. Jika gagal, lima marker berkoordinat tetap dapat dipakai dan pesan kegagalan tampil.
- Tampilan mobile-first, navigasi keyboard, label peta, serta pesan ketika key atau layanan belum tersedia.

## Cara mendapatkan dan membatasi Google Maps API key

1. Buka [Google Cloud Console](https://console.cloud.google.com/), login, lalu buat atau pilih proyek khusus latihan ini.
2. Aktifkan billing pada proyek. Google Maps JavaScript API umumnya memerlukan proyek dengan billing aktif; periksa kuota/budget agar tidak ada biaya tak terduga.
3. Buka **APIs & Services → Library**. Aktifkan **Maps JavaScript API** dan **Geocoding API** (untuk contoh alamat tanpa koordinat).
4. Buka **APIs & Services → Credentials → Create credentials → API key**.
5. Buka key yang baru dibuat. Pada **Application restrictions**, pilih **Websites (HTTP referrers)**. Tambahkan `http://127.0.0.1:8092/*` dan `http://localhost:8092/*`. Jika nanti dipublikasikan, tambahkan domain HTTPS yang benar; jangan memakai wildcard luas seperti `*`.
6. Pada **API restrictions**, pilih **Restrict key** lalu izinkan **Maps JavaScript API** dan **Geocoding API** saja. Simpan. Perubahan pembatasan mungkin perlu beberapa menit sebelum berlaku.
7. Dari folder ini, salin `config.example.js` menjadi `config.local.js`, lalu ganti nilai `GOOGLE_MAPS_API_KEY` dengan key tadi. Jangan kirim key lewat chat, screenshot, atau commit. File `config.local.js` sudah masuk `.gitignore`.

Key browser **tetap terlihat di DevTools** walaupun disimpan pada file lokal. File lokal mencegah key tak sengaja masuk Git, sedangkan pembatasan website dan API di Google Cloud adalah perlindungan utamanya. Pakai key terpisah untuk produksi; atur budget alert dan kuota sesuai kebutuhan.

## Pemeriksaan lokal

Jalankan server HTTP dari folder `src/geolocation-map`:

```bash
python3 -m http.server 8092
```

Buka `http://127.0.0.1:8092/shipment-map.html`. Jangan buka melalui `file://`, karena pembatasan referrer website dapat gagal. Cek enam marker, klik masing-masing marker/daftar, lalu pastikan `ANT-FRZ-0014` muncul setelah geocoding. Jika peta kosong, periksa Console dan Network browser, billing, kedua API yang aktif, serta referrer `127.0.0.1` versus `localhost`.

## Struktur

```text
src/geolocation-map/
├── shipment-map.html       # Struktur halaman
├── config.example.js       # Contoh konfigurasi tanpa key asli
├── config.local.js         # Key lokal; diabaikan Git
└── assets/
    ├── styles.css          # CSS responsif
    ├── shipments.js        # Data dummy
    └── map.js              # Loader Google Maps, marker, info window, geocoding
```

Latihan ini tidak mengubah peta Leaflet pada aplikasi React utama. Pull Request, review partner, dan merge dilakukan **setelah** key yang dibatasi diuji pada akun Google Cloud pemilik proyek. Jangan menganggap tes geocoding lulus sebelum peta benar-benar dimuat di browser.
