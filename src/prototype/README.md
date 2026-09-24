# Interactive Prototype — Anteraja Frozen

Implementasi ini melanjutkan kerangka semantik dan CSS responsif pada branch `7-prototype` dengan JavaScript modular. Styling tetap menggunakan **vanilla CSS** tanpa Bootstrap atau Tailwind. Data serta respons sensor masih berupa dummy lokal; belum ada request ke Laravel, Node-RED, MQTT, atau API eksternal selain tile OpenStreetMap untuk peta.

Elemen `application/ld+json` pada `index.html` tetap berfungsi sebagai data terstruktur schema.org dan terpisah dari JavaScript antarmuka.

## Halaman

| Halaman | FRD yang diwakili | Isi |
|---|---|---|
| [`index.html`](index.html) | FR-01 | Input maksimal 10 AWB. Navigasi hanya berisi informasi umum sebelum ada hasil. |
| [`shipments.html`](shipments.html) | FR-01 | Daftar hasil ringkas dengan nama tersamarkan, status bervariasi, dan tombol memilih satu detail. |
| [`tracking.html`](tracking.html) | FR-02 sampai FR-05 | Detail satu AWB: ringkasan, linimasa, kurir pickup/delivery, dokumentasi event, rute, suhu terbaru, jadwal pembaruan, dan riwayat. |
| [`tracking-delivered.html`](tracking-delivered.html) | FR-02 sampai FR-05 | Varian lengkap paket terkirim: seluruh linimasa, kurir pickup/delivery, penerima/keterangan, dua foto, rute selesai, dan pembacaan akhir suhu. |

FR-06 tidak memiliki halaman sendiri karena berfungsi sebagai aturan state dan microcopy pada komponen suhu.

## Pemetaan fitur

### FR-01 — Cari AWB

- Form menggunakan token field responsif untuk satu sampai 10 AWB; koma, tombol Enter, dan paste beberapa AWB akan diubah menjadi chip yang dapat dihapus.
- Input divalidasi, duplikasi dicegah, jumlah dibatasi, lalu daftar hasil dibentuk sesuai query string.
- `index.html` memuat JSON-LD bertipe [`WebApplication`](https://schema.org/WebApplication).

### FR-02 — Ringkasan dan linimasa

- Ringkasan menampilkan AWB, nama pengirim/penerima tersamarkan, kawasan, status, serta waktu event terakhir.
- Linimasa menggunakan ordered list dan menampilkan kejadian terbaru di atas.
- Linimasa adalah sumber detail perjalanan utama. Daftar titik dihapus agar tidak mengulang event yang sama.
- Event pickup/delivery dapat menampilkan nama tampilan kurir; delivered dapat menampilkan siapa yang menerima atau lokasi penempatan.
- Bagian dokumentasi menyediakan slot foto pickup dan delivery yang terkait ke event; paket aktif tidak menampilkan foto delivery sebelum event sah.
- Tidak menampilkan nama lengkap, nomor telepon, nomor kendaraan, alamat pribadi, atau identitas kurir selain nama tampilan yang memang relevan pada event pickup/delivery.

### FR-03 — Rute ilustratif

- Leaflet dan tile OpenStreetMap dimuat sebagai progressive enhancement serta membedakan segmen selesai dan berikutnya.
- Bila pustaka/peta jaringan gagal dimuat, SVG lokal tetap tampil sehingga informasi rute tidak hilang.
- Teks secara eksplisit menyatakan bahwa rute bukan posisi GPS langsung.

### FR-04 — Suhu dan riwayat

- Nilai contoh mengikuti profil data: cooler bag dan mobil boks −8°C s.d. −2°C, freezer hub −5°C s.d. −2°C.
- Nilai suhu dipisahkan dari waktu observasi.
- Riwayat tertutup secara default melalui `details`; tabel berubah menjadi susunan kartu di layar kecil.
- Tidak menggunakan grafik kontinu.

### FR-05 — Jadwal dan pembaruan suhu

- Halaman menampilkan pembaruan otomatis tiap 60 menit dan waktu berikutnya.
- Tombol `#refresh-temperature` menjalankan simulator lokal: loading, pembacaan normal/peringatan/kritis, pesan status, dan cooldown lima detik.
- Simulasi hanya untuk demonstrasi UX. Implementasi React/Laravel nanti mengganti sumber dummy dengan endpoint HTTP yang menerapkan rate limit dan idempotensi.

## Daftar interaksi JavaScript

1. Menambah beberapa AWB melalui koma, Enter, atau paste; menghapus chip; validasi format, duplikasi, dan batas 10.
2. Merender hasil pencarian secara dinamis, termasuk state AWB tidak ditemukan dan tautan detail yang sesuai.
3. Mengikat satu halaman detail ke lima skenario data: transit, tiba di hub, sedang diantar, dan dua varian terkirim.
4. Menyalin nomor AWB ke clipboard dengan umpan balik aksesibel.
5. Membuka foto pickup/penerimaan dalam dialog dan menutupnya melalui tombol atau backdrop.
6. Mengambil suhu simulasi dengan loading, klasifikasi normal/warning/critical, dan cooldown lima detik.
7. Memuat peta Leaflet/OpenStreetMap dengan progres perjalanan, marker bernomor, popup, legenda, serta fallback SVG.
8. Menampilkan toast aksesibel untuk tindakan penting: tambah/hapus/invalid AWB, salin AWB, hasil pembaruan suhu, dan kegagalan peta.
9. Menutup menu mobile otomatis setelah pengguna memilih tautan navigasi.

## Menjalankan secara lokal

Karena memakai ES modules, jalankan melalui server HTTP dari folder ini, bukan dengan membuka file secara langsung:

```bash
cd src/prototype
python3 -m http.server 8081
```

Kemudian buka `http://127.0.0.1:8081/`.

## Responsivitas dan aksesibilitas

- CSS ditulis dengan pendekatan mobile-first.
- Breakpoint utama: `48rem` untuk tablet dan `64rem` untuk layout desktop dua kolom.
- Header halaman awal hanya menyediakan Beranda, Fitur Pelacakan, FAQ, dan Bantuan. Daftar hasil memiliki navigasi pencarian/hasil; navigasi detail baru tersedia setelah satu AWB dipilih.
- Kontrol memiliki tinggi minimum 44px, focus ring terlihat, dan dukungan `prefers-reduced-motion`.
- Struktur memakai `header`, `main`, `section`, `article`, `aside`, `nav`, `footer`, heading berurutan, tabel semantik, dan skip link.
- Halaman tidak memerlukan horizontal scroll pada lebar target 360px, 390px, 768px, dan desktop.

## Struktur file

```text
src/prototype/
├── index.html
├── shipments.html
├── tracking.html
├── tracking-delivered.html
├── README.md
└── assets/
    ├── css/
    │   └── styles.css
    ├── images/
    │   ├── favicon.svg
    │   ├── logo-anteraja.png
    │   └── evidence/
    │       ├── ANT-FRZ-0002-pickup.webp
    │       ├── ANT-FRZ-0012-pickup.webp
    │       └── ANT-FRZ-0012-delivery.webp
    └── js/
        ├── common.js
        ├── data.js
        ├── route-map.js
        ├── search.js
        ├── shipments.js
        └── tracking.js
```

Halaman menggunakan salinan lokal dari aset logo yang ditampilkan pada situs resmi Anteraja. Foto dokumentasi pada prototipe menggunakan foto stok berlisensi terbuka yang telah dipotong, dioptimalkan ke WebP, dan dibersihkan dari metadata EXIF. Sumber dan pemetaan foto dicatat di `docs/database/sample-data/media/README.md`; sebelum deployment produksi, seluruh foto tersebut diganti dengan bukti operasional yang lolos pemeriksaan privasi.
