# Anteraja Frozen — UI Design Documentation

Dokumentasi ini berisi rancangan antarmuka pengguna untuk **Anteraja Frozen — Tracking Paket dan Pemantauan Suhu Cold Chain**. Rancangan dibuat berdasarkan PRD dan FRD, terutama FR-01 sampai FR-05, sedangkan FR-06 diterapkan sebagai aturan state dan microcopy lintas komponen. Aplikasi dirancang sebagai responsive public web tracker tanpa login, dengan pencarian satu nomor AWB dan satu halaman hasil pelacakan terpadu.

## Tujuan Desain

Rancangan UI membantu pengguna untuk:

- mencari paket menggunakan nomor AWB;
- melihat status dan linimasa perjalanan paket;
- melihat urutan pickup point, hub, dan delivery point;
- melihat suhu lingkungan aset termal yang membawa atau menyimpan paket;
- meminta pembaruan suhu terbaru;
- memahami kondisi normal, peringatan, kritis, stale, loading, berhasil, dan gagal.

> Suhu pada antarmuka merupakan suhu lingkungan aset penyimpanan atau armada, bukan suhu inti produk. Peta merupakan visualisasi ilustratif berdasarkan urutan titik singgah, bukan lokasi GPS langsung.

## Acuan dan Perangkat

- **Acuan kebutuhan:** PRD, FRD global, dan FRD per fitur.
- **Pembuatan desain:** Google Stitch.
- **Format hasil:** WebP.
- **Dokumentasi:** Markdown.
- **Pendekatan desain:** mengikuti identitas visual Anteraja dengan penggunaan logo yang disediakan, warna magenta, ruang putih yang lapang, kartu informasi, pill button, dan tipografi yang mudah dibaca.
- **MCP:** tidak diperlukan untuk menghasilkan file desain statis ini. MCP dapat digunakan pada tahap pengembangan apabila perlu menghubungkan aplikasi dengan layanan atau data eksternal.

## Arsitektur Antarmuka

Walaupun desain didokumentasikan per FR agar mudah dinilai, implementasi akhirnya menggunakan satu alur utama:

```text
Halaman Awal
└── FR-01 — Pencarian AWB
    ├── Format tidak sesuai
    ├── Loading
    ├── Tidak ditemukan
    └── AWB ditemukan
        └── Halaman Hasil Pelacakan
            ├── FR-02 — Ringkasan dan linimasa
            ├── FR-03 — Peta ilustratif / daftar titik
            ├── FR-04 — Suhu dan riwayat
            └── FR-05 — Pembaruan suhu

FR-06 diterapkan sebagai aturan state sistem, bukan halaman tersendiri.
```

## Struktur Folder Pengumpulan

```text
ui-design/
├── README.md
├── DESIGN.md
├── UI_AUDIT.md
└── designs/
    ├── FR01 - Cari AWB (Default).webp
    ├── FR01 - Cari AWB (Loading State).webp
    ├── ...
    └── FR05 - Perbarui Suhu (Success & Cooldown Guard).webp
```

`DESIGN.md` memuat design system dan aturan implementasi. `UI_AUDIT.md` menjelaskan evaluasi dan koreksi yang perlu diterapkan sebelum implementasi produksi. Folder `designs/` memuat seluruh rancangan berformat WebP.

## Daftar Desain UI

### FR-01 — Cari AWB

| Desain | Tujuan |
|---|---|
| [Default](<designs/FR01 - Cari AWB (Default).webp>) | Halaman awal untuk memasukkan nomor AWB. |
| [Format Tidak Sesuai](<designs/FR01 - Cari AWB (Format Tidak Sesuai).webp>) | Umpan balik ketika format masukan tidak valid. |
| [Loading State](<designs/FR01 - Cari AWB (Loading State).webp>) | Kondisi saat sistem mencari data pengiriman. |
| [Tidak Ditemukan](<designs/FR01 - Cari AWB (Tidak Ditemukan).webp>) | Kondisi ketika AWB tidak tersedia. |

### FR-02 — Pelacakan Paket dan Linimasa

| Desain | Tujuan |
|---|---|
| [Picked Up](<designs/FR02 - Pelacakan Paket & Linimasa (Picked Up).webp>) | Paket telah dijemput dari pickup point. |
| [At Hub](<designs/FR02 - Pelacakan Paket & Linimasa (At Hub).webp>) | Paket berada di hub. |
| [In Transit](<designs/FR02 - Pelacakan Paket & Linimasa Perjalanan.webp>) | Paket bergerak menuju titik berikutnya. |
| [Out for Delivery](<designs/FR02 - Pelacakan Paket & Linimasa (Out for Delivery).webp>) | Paket sedang diantar menuju delivery point. |
| [Delivered](<designs/FR02 - Pelacakan Paket & Linimasa (Delivered).webp>) | Pengiriman telah selesai. |

### FR-03 — Peta Rute Ilustratif

| Desain | Tujuan |
|---|---|
| [Tahap Awal](<designs/FR03 Peta Rute Ilustratif (Tahap Awal).webp>) | Menunjukkan rute sebelum perjalanan antartitik dimulai. |
| [Dalam Perjalanan](<designs/FR03 - Peta Rute Ilustratif (Dalam Perjalanan).webp>) | Menunjukkan segmen selesai, aktif, dan berikutnya. |
| [Fallback Daftar Titik](<designs/FR03 - Peta Rute Ilustratif (Fallback Daftar Titik Singgah).webp>) | Alternatif ketika peta tidak tersedia atau pengguna memilih mode daftar. |
| [Terkirim](<designs/FR03 - Peta Rute Ilustratif (Terkirim).webp>) | Seluruh titik perjalanan telah selesai. |

### FR-04 — Suhu dan Riwayat

| Desain | Tujuan |
|---|---|
| [Normal](<designs/FR04 - Suhu & Riwayat Telemetri (Normal).webp>) | Pembacaan suhu berada dalam rentang yang ditentukan. |
| [Warning](<designs/FR04 - Suhu & Riwayat Telemetri (Warning).webp>) | Pembacaan perlu diperhatikan. |
| [Critical](<designs/FR04 - Suhu & Riwayat Telemetri (Critical).webp>) | Pembacaan melewati batas kritis. |
| [Stale](<designs/FR04 - Suhu & Riwayat Telemetri (Stale).webp>) | Pembacaan terakhir berusia lebih dari batas kesegaran data. |

### FR-05 — Perbarui Suhu

| Desain | Tujuan |
|---|---|
| [Default Click](<designs/FR05 - Perbarui Suhu (Default Click).webp>) | Tombol pembaruan siap digunakan. |
| [Loading State](<designs/FR05 - Perbarui Suhu (Loading State).webp>) | Sistem sedang mengambil pembacaan terbaru. |
| [Success dan Cooldown](<designs/FR05 - Perbarui Suhu (Success & Cooldown Guard).webp>) | Pembaruan berhasil dan tombol memasuki masa jeda. |
| [Retry State](<designs/FR05 - Perbarui Suhu (Retry State).webp>) | Permintaan gagal; data valid terakhir tetap dipertahankan. |
| [Delivered State](<designs/FR05 - Perbarui Suhu (Delivered State).webp>) | Paket selesai; tombol hanya memuat ulang data tersimpan. |

## Keputusan Desain Utama

### 1. Single-page tracker

FR digunakan untuk memisahkan kebutuhan dan state dalam dokumentasi. Pada aplikasi, FR-02 sampai FR-05 digabungkan dalam satu halaman hasil agar pengguna tidak perlu berpindah halaman.

### 2. Progressive disclosure

Informasi utama adalah status paket, suhu terakhir, waktu observasi, dan posisi tahap perjalanan. Riwayat suhu lengkap ditutup secara default, dimuat maksimal 20 data, lalu dilanjutkan melalui tombol **Muat berikutnya**.

### 3. Status mudah dikenali

Normal, warning, critical, dan stale dibedakan melalui kombinasi warna, ikon, dan label. Informasi tidak bergantung pada warna saja.

### 4. Pemisahan data logistik dan suhu

Pembaruan suhu tidak mengubah status paket, event perjalanan, atau progres rute. Status pengiriman hanya mengikuti event logistik yang sah.

### 5. Resilient error state

Jika pembaruan suhu gagal, suhu terakhir dan waktu observasi terakhir tetap ditampilkan. Sistem tidak mengganti nilai dengan `0°C` dan tidak menampilkan istilah teknis internal kepada pengguna.

### 6. Responsive design

Desktop menggunakan dua kolom untuk memisahkan ringkasan dan detail. Mobile menggunakan satu kolom dengan prioritas: pencarian, status paket, suhu terbaru, linimasa, daftar titik/peta, ringkasan segmen, riwayat, lalu bantuan.

## Design System Ringkas

| Elemen | Ketentuan |
|---|---|
| Warna utama | Magenta Anteraja `#ED0677` |
| Font | Plus Jakarta Sans dengan fallback sans-serif |
| Latar halaman | Netral terang `#F8FAFC` |
| Normal | Hijau dengan ikon dan label |
| Warning | Amber dengan ikon dan label |
| Critical | Merah dengan ikon dan label |
| Stale | Slate/abu-abu dengan ikon dan label |
| Radius | 16 px untuk kartu, pill untuk tombol utama dan badge |
| Touch target | Minimum 44 × 44 px |

Spesifikasi lengkap tersedia pada [DESIGN.md](./DESIGN.md).

## Catatan Evaluasi

Rancangan WebP merupakan dokumentasi visual per fitur dan state. Sebelum implementasi, isi layar perlu mengikuti koreksi pada [UI_AUDIT.md](./UI_AUDIT.md), terutama terkait konsistensi contoh suhu, penghapusan GPS/ETA, pembatasan data pribadi, penggunaan peta ilustratif, dan penyederhanaan riwayat suhu.

## Cakupan Branch

Seluruh dokumen dan desain UI pada tugas ini disimpan di branch:

```text
5-ui
```

Branch ini tidak perlu digabungkan ke `main` selama proses penilaian, kecuali terdapat instruksi lanjutan dari pengajar.

## Identitas Proyek

- **Proyek:** Anteraja Frozen
- **Fokus:** Shipment tracking dan cold-chain temperature monitoring
- **Format desain:** WebP
- **Dokumentasi:** Markdown
- **Branch pengumpulan:** `5-ui`
