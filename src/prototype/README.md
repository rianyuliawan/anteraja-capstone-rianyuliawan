# Implementasi HTML/CSS — Anteraja Frozen

Implementasi ini mengonversi desain UI Anteraja Frozen menjadi kerangka web semantik, responsif, dan saling terhubung. Implementasi tahap ini hanya menggunakan **HTML dan CSS murni**. Tidak ada file JavaScript, framework CSS, Bootstrap, Tailwind, atau request API.

Elemen `script` pada `index.html` hanya berisi data terstruktur `application/ld+json` sesuai persyaratan tugas dan tidak menjalankan perilaku antarmuka.

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

- Form menggunakan token field responsif untuk satu sampai 10 AWB; setiap koma nantinya diubah JavaScript menjadi chip yang dapat dihapus.
- Karena tahap ini HTML/CSS murni, halaman daftar hasil memakai lima skenario representatif. Validasi, parsing, dan pemetaan hasil dinamis diterapkan pada tahap JavaScript/React.
- `index.html` memuat JSON-LD bertipe [`WebApplication`](https://schema.org/WebApplication).

### FR-02 — Ringkasan dan linimasa

- Ringkasan menampilkan AWB, nama pengirim/penerima tersamarkan, kawasan, status, serta waktu event terakhir.
- Linimasa menggunakan ordered list dan menampilkan kejadian terbaru di atas.
- Linimasa adalah sumber detail perjalanan utama. Daftar titik dihapus agar tidak mengulang event yang sama.
- Event pickup/delivery dapat menampilkan nama tampilan kurir; delivered dapat menampilkan siapa yang menerima atau lokasi penempatan.
- Bagian dokumentasi menyediakan slot foto pickup dan delivery yang terkait ke event; paket aktif tidak menampilkan foto delivery sebelum event sah.
- Tidak menampilkan nama lengkap, nomor telepon, nomor kendaraan, alamat pribadi, atau identitas kurir selain nama tampilan yang memang relevan pada event pickup/delivery.

### FR-03 — Rute ilustratif

- Visual SVG statis membedakan segmen selesai, titik aktif, dan segmen berikutnya.
- Pada layar kecil, peta dapat dibuka melalui elemen `details`; bila peta gagal, linimasa tetap menjadi sumber urutan perjalanan.
- Teks secara eksplisit menyatakan bahwa rute bukan posisi GPS langsung.

### FR-04 — Suhu dan riwayat

- Nilai contoh mengikuti profil data: cooler bag dan mobil boks −8°C s.d. −2°C, freezer hub −5°C s.d. −2°C.
- Nilai suhu dipisahkan dari waktu observasi.
- Riwayat tertutup secara default melalui `details`; tabel berubah menjadi susunan kartu di layar kecil.
- Tidak menggunakan grafik kontinu.

### FR-05 — Jadwal dan pembaruan suhu

- Halaman menampilkan pembaruan otomatis tiap 60 menit dan waktu berikutnya.
- Tombol `#refresh-temperature` meminta suhu terbaru untuk paket aktif; Laravel nantinya menerapkan cooldown, rate limit, dan idempotensi.
- Tombol belum menjalankan request karena branch ini hanya HTML/CSS.

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
    └── images/
        ├── logo-anteraja.png
        └── evidence/
            └── ANT-FRZ-0002-pickup.webp
```

Halaman menggunakan salinan lokal dari aset logo yang ditampilkan pada situs resmi Anteraja. Foto dokumentasi pada prototipe menggunakan foto stok berlisensi terbuka yang telah dipotong, dioptimalkan ke WebP, dan dibersihkan dari metadata EXIF. Sumber dan pemetaan foto dicatat di `docs/database/sample-data/media/README.md`; sebelum deployment produksi, seluruh foto tersebut diganti dengan bukti operasional yang lolos pemeriksaan privasi.
