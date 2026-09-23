# Prototype HTML/CSS — Anteraja Frozen

Prototype ini mengonversi rancangan UI Anteraja Frozen menjadi kerangka web semantik, responsif, dan saling terhubung. Implementasi tahap ini hanya menggunakan **HTML dan CSS murni**. Tidak ada file JavaScript, framework CSS, Bootstrap, Tailwind, atau request API.

Elemen `script` pada `index.html` hanya berisi data terstruktur `application/ld+json` sesuai persyaratan tugas dan tidak menjalankan perilaku antarmuka.

## Menjalankan prototype

Dari root repository:

```bash
python3 -m http.server 8080 --directory src/prototype
```

Kemudian buka `http://127.0.0.1:8080/`.

## Halaman

| Halaman | FRD yang diwakili | Isi |
|---|---|---|
| [`index.html`](index.html) | FR-01 | Pencarian AWB, penjelasan informasi yang tersedia, FAQ, dan kontak bantuan. Form mengarah ke halaman hasil menggunakan metode `GET`. |
| [`tracking.html`](tracking.html) | FR-02 sampai FR-05 | Ringkasan paket, linimasa, rute ilustratif dan fallback daftar titik, suhu terbaru, ringkasan segmen, riwayat suhu, serta tombol pembaruan suhu. |

FR-06 tidak memiliki halaman sendiri karena berfungsi sebagai aturan state dan microcopy pada komponen suhu.

## Pemetaan fitur

### FR-01 — Cari AWB

- Form menggunakan landmark pencarian, label yang terlihat, `required`, dan pola dasar input.
- Contoh AWB mengarah ke halaman hasil agar alur prototype dapat diperiksa tanpa JavaScript.
- `index.html` memuat JSON-LD bertipe [`WebApplication`](https://schema.org/WebApplication).

### FR-02 — Ringkasan dan linimasa

- Ringkasan hanya menampilkan AWB, kawasan asal/tujuan, status, serta waktu event terakhir.
- Linimasa menggunakan ordered list dan menampilkan kejadian terbaru di atas.
- Tidak menampilkan nama penerima, nomor telepon, kurir, nomor kendaraan, atau alamat pribadi.

### FR-03 — Rute ilustratif

- Visual SVG statis membedakan segmen selesai, titik aktif, dan segmen berikutnya.
- Pada layar kecil, daftar titik menjadi informasi utama dan peta dapat dibuka melalui elemen `details`.
- Teks secara eksplisit menyatakan bahwa rute bukan posisi GPS langsung.

### FR-04 — Suhu dan riwayat

- Nilai contoh mengikuti profil rancangan: cooler bag dan mobil boks −8°C s.d. −2°C, freezer hub −5°C s.d. −2°C.
- Nilai suhu dipisahkan dari waktu observasi.
- Riwayat tertutup secara default melalui `details`; tabel berubah menjadi susunan kartu di layar kecil.
- Tidak menggunakan grafik kontinu.

### FR-05 — Perbarui suhu

- Tombol memiliki selector `#refresh-temperature` dan `.js-refresh-temperature` untuk tahap JavaScript/jQuery berikutnya.
- Region status memakai `#refresh-status` dan `role="status"`.
- Tombol belum menjalankan request karena tahap tugas ini hanya HTML/CSS.

## Responsivitas dan aksesibilitas

- CSS ditulis dengan pendekatan mobile-first.
- Breakpoint utama: `48rem` untuk tablet dan `64rem` untuk layout desktop dua kolom.
- Kontrol memiliki tinggi minimum 44px, focus ring terlihat, dan dukungan `prefers-reduced-motion`.
- Struktur memakai `header`, `main`, `section`, `article`, `aside`, `nav`, `footer`, heading berurutan, tabel semantik, dan skip link.
- Halaman tidak memerlukan horizontal scroll pada lebar target 360px, 390px, 768px, dan desktop.

## Struktur file

```text
src/prototype/
├── index.html
├── tracking.html
├── README.md
└── assets/
    └── css/
        └── styles.css
```

Logo pada prototype memakai URL aset resmi Anteraja sebagai referensi visual. Untuk deployment produksi, aset perlu disimpan dan dilayani dari aplikasi sendiri setelah hak penggunaan serta versi aset dikonfirmasi.
