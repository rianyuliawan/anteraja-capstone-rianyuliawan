# DESIGN.md — Anteraja Frozen

## Tracking Paket dan Pemantauan Suhu Cold Chain

**Status:** Spesifikasi desain MVP  
**Platform:** Responsive public web application  
**Pola navigasi:** Single-page tracker tanpa login

Dokumen ini menjadi acuan desain antarmuka untuk FR-01 sampai FR-06. Ia menyatukan struktur halaman, komponen, state, aturan penyajian data, responsivitas, aksesibilitas, dan batasan klaim produk.

---

## 1. Urutan Sumber Kebenaran

Jika terdapat perbedaan antara dokumen atau mockup, gunakan urutan berikut:

1. PRD yang telah disetujui;
2. FRD global dan FRD per fitur;
3. kontrak API dan skema database;
4. DESIGN.md ini;
5. mockup/screenshot sebagai referensi visual.

Mockup tidak boleh menambah data, fitur, atau klaim operasional yang tidak tersedia pada sumber di atas.

---

## 2. Ikhtisar Produk

- **Nama:** Anteraja Frozen
- **Subjudul:** Tracking Paket dan Pemantauan Suhu Cold Chain
- **Pengguna:** pengirim atau penerima yang memiliki nomor AWB.
- **Tujuan:** membantu pengguna melihat posisi tahap pengiriman, urutan titik singgah, suhu lingkungan aset termal, dan waktu pembaruan terakhir.
- **Akses:** publik, satu AWB per pencarian, tanpa akun.

### Batas MVP

MVP mencakup:

- pencarian AWB berbasis teks;
- ringkasan paket dan status terakhir;
- linimasa event logistik;
- peta rute ilustratif dan fallback daftar titik;
- suhu terakhir aset aktif;
- ringkasan suhu terakhir per segmen;
- riwayat suhu terbatas dan bertahap;
- pembaruan suhu manual;
- pembaruan berkala sekitar 30 menit dari sistem;
- tampilan responsif.

MVP tidak mencakup:

- login, pemesanan, atau panel operasi;
- pemindaian kamera/barcode;
- GPS langsung, posisi kendaraan real-time, ETA, dan navigasi jalan;
- bukti serah terima digital;
- pembagian status;
- notifikasi;
- incident management atau dispatcher workflow;
- integrasi resmi sistem produksi Anteraja;
- klaim sensor fisik yang telah terpasang di armada operasional.

---

## 3. Arsitektur Informasi dan Alur Halaman

Sistem menggunakan satu alur utama, bukan halaman terpisah untuk setiap FR.

```text
Halaman Awal
  └─ Pencarian AWB (FR-01)
       ├─ format salah
       ├─ sedang mencari
       ├─ AWB tidak ditemukan
       └─ AWB ditemukan
            └─ Halaman Hasil Pelacakan
                 ├─ Ringkasan & linimasa (FR-02)
                 ├─ Peta / daftar titik (FR-03)
                 ├─ Suhu & riwayat (FR-04)
                 └─ Perbarui suhu (FR-05)

FR-06 berlaku sebagai aturan state sistem lintas komponen.
```

### Susunan Halaman Hasil

1. Header global.
2. Search AWB ringkas.
3. Ringkasan status paket.
4. Suhu terakhir dan aksi pembaruan.
5. Linimasa perjalanan.
6. Peta ilustratif / daftar titik singgah.
7. Ringkasan suhu per segmen.
8. Riwayat suhu bertahap.
9. Bantuan Customer Care.
10. Footer global.

---

## 4. Kontrak Data yang Boleh Ditampilkan

### Data publik MVP

- `awb_number`
- `current_stage`
- `last_event_at`
- `pickup_area` dan `pickup_point`
- `delivery_area` dan `delivery_point`
- daftar shipment event
- daftar route stop dan urutannya
- `thermal_asset_type` dan `thermal_asset_id`
- `temperature_c`
- `observed_at`
- `temperature_status`

### Jangan diciptakan di UI

Kecuali kontrak API dan FRD diperbarui, UI tidak boleh menampilkan:

- nama atau nomor telepon penerima;
- alamat pribadi lengkap;
- nama kurir/petugas;
- nomor polisi kendaraan;
- jenis, foto, berat, atau isi paket;
- catatan operasional internal;
- bukti serah terima;
- posisi GPS, nama jalan aktif, dan ETA;
- tindakan dispatcher atau penanganan insiden.

---

## 5. Prinsip Desain

### 5.1 Jujur terhadap data

- Suhu adalah **suhu lingkungan aset penyimpanan/armada**, bukan suhu inti produk.
- Peta adalah representasi urutan titik singgah, bukan posisi kendaraan langsung.
- Status paket hanya berubah karena event logistik yang sah.
- Perubahan suhu tidak boleh mengubah tahap, timeline, atau rute paket.

### 5.2 Progresif dan hemat data

- Tampilkan suhu terakhir dan ringkasan segmen terlebih dahulu.
- Anomali selalu terlihat.
- Riwayat lengkap dimuat setelah diminta pengguna.
- Jangan menggunakan grafik kontinu pada MVP apabila data hanya berupa pembacaan diskret.

### 5.3 Tangguh saat terjadi kegagalan

- Pertahankan suhu terakhir yang valid dan `observed_at` aslinya.
- Jangan pernah mengganti kegagalan dengan `0°C`.
- Bedakan jelas waktu observasi sensor dengan waktu permintaan pengguna.

### 5.4 Bahasa manusia

- Hindari istilah `Node-RED`, `payload`, `gateway`, `UUID`, endpoint API, kode HTTP, atau detail timeout di UI publik.
- Gunakan bahasa Indonesia yang singkat, tenang, dan menjelaskan tindakan berikutnya.

---

## 6. Design System

### 6.1 Warna

```css
:root {
  --brand-primary: #ed0677;
  --brand-hover: #c90061;
  --brand-soft: #fff0f6;
  --brand-border: #fbcfe8;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;
  --surface-page: #f8fafc;
  --surface-card: #ffffff;
  --surface-muted: #f1f5f9;
  --border-default: #e2e8f0;

  --normal-text: #047857;
  --normal-bg: #ecfdf5;
  --normal-border: #a7f3d0;

  --warning-text: #92400e;
  --warning-bg: #fffbeb;
  --warning-border: #fcd34d;

  --critical-text: #b91c1c;
  --critical-bg: #fef2f2;
  --critical-border: #fecaca;

  --stale-text: #475569;
  --stale-bg: #f1f5f9;
  --stale-border: #cbd5e1;

  --route-completed: #ed0677;
  --route-current: #0891b2;
  --route-remaining: #cbd5e1;
}
```

Status tidak boleh disampaikan dengan warna saja. Selalu gunakan kombinasi ikon, label, dan warna.

### 6.2 Tipografi

- Font utama: **Plus Jakarta Sans**.
- Fallback: `Inter, ui-sans-serif, system-ui, sans-serif`.
- Nilai suhu dan waktu memakai `font-variant-numeric: tabular-nums`.
- Heading halaman: 28–36 px, weight 700.
- Heading bagian: 20–24 px, weight 700.
- Heading kartu: 16–18 px, weight 600–700.
- Body: 14–16 px.
- Microcopy: minimal 12 px, ideal 13–14 px.

### 6.3 Spacing, radius, dan bayangan

- Gunakan skala jarak 4, 8, 12, 16, 24, 32, 48, dan 64 px.
- Tombol/search pill: radius penuh.
- Kartu utama: radius 16 px.
- Kartu kecil: radius 12 px.
- Bayangan kartu ringan; jangan memakai glow atau glassmorphism berlebihan.

### 6.4 Interaksi

- Tinggi minimum kontrol sentuh: 44 px.
- Semua kontrol memiliki state default, hover, focus-visible, pressed, disabled, loading, dan error bila relevan.
- Focus ring: 2 px dengan offset yang jelas.
- Animasi 150–250 ms dan menghormati `prefers-reduced-motion`.

---

## 7. Kerangka Global

### Header

- Tinggi desktop 72–80 px; mobile 64 px.
- Logo resmi yang telah disetujui di kiri, tanpa digambar ulang atau didistorsi.
- Tautan `Pusat Bantuan` di kanan.
- Tidak ada navigasi yang tidak berfungsi.

### Search AWB

- Label terlihat atau accessible name: `Nomor resi / AWB`.
- Placeholder: `Contoh: ANT-FRZ-0002`.
- Tombol: `Lacak Paket`.
- Tombol hapus input hanya tampil ketika ada isi dan memiliki label `Hapus nomor AWB`.
- Tombol Enter menjalankan pencarian.
- Normalisasi input: trim dan uppercase.
- Validasi pola mengikuti backend. Contoh `ANT-FRZ-0002` adalah format data proyek, bukan klaim format AWB resmi Anteraja.

### Bantuan Customer Care

- Judul: `Butuh bantuan terkait kiriman Anda?`
- Kontak yang ditampilkan hanya kontak yang telah diverifikasi:
  - telepon `(021) 5066 3333`;
  - email `cs@anteraja.id`.
- Jangan menambahkan klaim waktu respons, dispatcher khusus, atau layanan siaga dingin apabila belum disetujui.

### Footer

- Logo resmi.
- Deskripsi singkat tanpa klaim berlebihan.
- Tautan hanya yang benar-benar tersedia.
- Tahun hak cipta harus dinamis, bukan hard-coded.

---

## 8. FR-01 — Pencarian AWB

### Default

- Fokus utama pada judul, deskripsi singkat, dan search AWB.
- Edukasi pendukung maksimal tiga kartu ringkas.
- Jangan menampilkan vaksin/farmasi, barcode scanner, sertifikasi, garansi kesegaran, atau grafik suhu real-time.

### Loading

- Input dan tombol tidak dapat dikirim ulang.
- Tombol berlabel `Mencari…` dengan spinner.
- Gunakan `aria-busy="true"` pada area hasil.
- Microcopy: `Mencari data pengiriman…`.
- Jangan menyebut gateway atau sensor karena proses ini mencari paket.

### Format tidak sesuai

- Pesan: `Format nomor AWB belum sesuai. Periksa kembali nomor yang Anda masukkan.`
- Jangan menjelaskan anatomi AWB sebagai format resmi apabila belum ada sumber resmi.
- Data hasil pencarian sebelumnya harus dihapus.

### Tidak ditemukan

- Judul: `Nomor AWB tidak ditemukan`.
- Jelaskan kemungkinan sinkronisasi data atau salah ketik secara netral.
- Beri aksi `Periksa kembali` dan `Hubungi Customer Care`.
- Data paket dan suhu sebelumnya tidak boleh tetap terlihat.

---

## 9. FR-02 — Ringkasan dan Linimasa

### Ringkasan

Tampilkan:

- AWB dan tombol salin;
- label status saat ini;
- pickup area/point;
- delivery area/point;
- waktu event terakhir.

Status utama:

- `Paket diambil`
- `Tiba di hub`
- `Dalam perjalanan`
- `Sedang diantar`
- `Terkirim`

### Linimasa

- Urutan terbaru di atas pada desktop dan mobile.
- Setiap event menampilkan status, lokasi umum, serta tanggal dan waktu.
- Multi-hub diperbolehkan: `AT_HUB → IN_TRANSIT → AT_HUB`.
- Jangan menyisipkan nama petugas, nomor kendaraan, tindakan internal, atau detail alamat jika tidak ada pada respons API.

### Delivered

- Status akhir berwarna hijau dengan ikon centang dan teks `Terkirim`.
- Linimasa bersifat read-only.
- Suhu terakhir diberi label `Pembacaan akhir` atau `Pembacaan terakhir sebelum selesai`, bukan bukti suhu inti produk.

---

## 10. FR-03 — Peta Rute Ilustratif

### Aturan visual

- Segmen selesai: garis solid magenta.
- Segmen aktif: garis solid cyan atau magenta dengan penanda aktif.
- Segmen berikutnya: garis abu-abu putus-putus.
- Tanpa progres sah: seluruh segmen netral kecuali titik awal.
- Marker menunjukkan pickup point, hub, delivery point, atau tujuan umum.

### Batas klaim

- Tambahkan label: `Rute ilustratif berdasarkan urutan titik singgah, bukan posisi langsung.`
- Jangan menampilkan `GPS Aktif`, ETA, ruas jalan aktif, atau ikon kendaraan yang bergerak seolah-olah live.
- Koordinat dipakai untuk marker area/hub dan tidak boleh dipresentasikan sebagai lokasi presisi paket.

### Toggle

- Pilihan `Peta` dan `Daftar Titik` menggunakan kontrol segmented yang dapat digunakan dengan keyboard.
- State aktif tidak hanya dibedakan melalui warna.
- Pada mobile, default ke `Daftar Titik`; pengguna dapat membuka peta.
- Jika tile peta gagal dimuat, sistem otomatis menampilkan daftar titik dan pesan singkat.

---

## 11. FR-04 — Suhu dan Riwayat

### Makna suhu

Semua nilai adalah suhu lingkungan aset termal. Gunakan disclaimer konsisten:

> Suhu yang ditampilkan merupakan suhu lingkungan aset penyimpanan atau armada, bukan suhu inti produk.

### Profil suhu rancangan

| Jenis aset | Rentang normal | Contoh nilai normal untuk mockup |
|---|---:|---:|
| Hub Freezer | `-5°C` s.d. `-2°C` | `-4.1°C` |
| Cooler Bag | `-8°C` s.d. `-2°C` | `-5.4°C` |
| Mobil Boks | `-8°C` s.d. `-2°C` | `-5.1°C` |

Status `NORMAL`, `WARNING`, dan `CRITICAL` harus berasal dari backend berdasarkan profil aset. Frontend tidak menghitung ulang ambang secara independen.

**Dilarang menggunakan `-19°C` atau `-22°C` sebagai contoh NORMAL untuk profil di atas.** Angka suhu produk pada saat serah terima tidak boleh dipakai sebagai ambang suhu lingkungan aset.

### Kartu suhu aktif

Tampilkan:

- jenis dan kode aset;
- nilai suhu terakhir;
- status suhu;
- `Terobservasi: [tanggal dan waktu]`;
- disclaimer suhu lingkungan;
- tombol pembaruan bila paket belum selesai.

### Ringkasan per segmen

- Satu kartu per penugasan aset/segmen.
- Segmen selesai menampilkan pembacaan terakhir segmen.
- Segmen aktif menampilkan pembacaan terbaru.
- Anomali diberi label yang jelas.

### Riwayat suhu

- Tertutup secara default.
- Saat dibuka, muat maksimal 20 baris pertama.
- Kolom desktop: waktu observasi, aset, suhu, status.
- Catatan hanya ditampilkan jika memang ada di data.
- Gunakan `Muat berikutnya` untuk pagination.
- Mobile menggunakan kartu, bukan tabel horizontal.
- Jangan menginterpolasi titik menjadi grafik kontinu pada MVP.

### Stale

- Bila `observed_at` lebih dari 60 menit, tampilkan status `Data belum diperbarui`.
- Nilai terakhir dan waktu observasi asli tetap tampil.
- Stale adalah status kesegaran data, bukan otomatis status suhu. Bila perlu, tampilkan keduanya secara terpisah.

---

## 12. FR-05 — Perbarui Suhu

### State machine

| State | Tombol | Perilaku |
|---|---|---|
| Siap | `Perbarui Suhu` | Meminta pembacaan terbaru. |
| Loading | `Mengambil suhu terbaru…` | Disabled dan menampilkan spinner. |
| Berhasil | `Tunggu 5 detik` | Data baru tampil; tombol disabled selama cooldown. |
| Gagal | `Coba Lagi` | Data lama tetap tampil; `observed_at` tidak berubah. |
| Rate limited | `Tunggu sebentar` | Tampilkan waktu tunggu dari backend bila tersedia. |
| Delivered | `Muat Ulang Data` | Hanya mengambil ulang data tersimpan, tidak menghasilkan pembacaan baru. |

### Copy keberhasilan

`Suhu terbaru berhasil diperbarui pada [waktu observasi].`

### Copy kegagalan

`Pembacaan terbaru belum dapat diambil. Data terakhir yang valid tetap ditampilkan.`

Jangan tampilkan istilah gateway, payload, timeout milidetik, endpoint, atau Node-RED.

### Isolasi perubahan

Pembaruan hanya boleh mengubah:

- `temperature_c`;
- `temperature_status`;
- `observed_at`;
- daftar riwayat suhu apabila pembacaan baru valid.

Pembaruan tidak boleh mengubah status paket, event perjalanan, urutan titik, atau peta.

---

## 13. FR-06 — Pemetaan State Sistem

FR-06 tidak mempunyai halaman sendiri. Ia menentukan copy lintas fitur.

| Kondisi internal | Copy publik |
|---|---|
| data belum tersedia | `Belum ada data suhu untuk tahap ini.` |
| sumber pembacaan tidak merespons | `Pembacaan terbaru belum dapat diambil.` |
| waktu tunggu habis | `Permintaan membutuhkan waktu lebih lama. Silakan coba lagi.` |
| data stale | `Data belum diperbarui. Menampilkan pembacaan terakhir yang valid.` |
| terlalu banyak permintaan | `Mohon tunggu sejenak sebelum memperbarui kembali.` |
| layanan sementara tidak tersedia | `Data sementara tidak dapat dimuat. Silakan coba kembali.` |

Pesan error menggunakan `role="alert"`; status loading/sukses nonkritis menggunakan `role="status"` dan `aria-live="polite"`.

---

## 14. Responsive Layout

### Mobile: 320–639 px

- Satu kolom.
- Padding halaman 16 px.
- Search dapat membungkus tombol menjadi lebar penuh.
- Urutan prioritas: ringkasan paket → suhu aktif/refresh → timeline → daftar titik/peta → ringkasan segmen → riwayat → bantuan.
- Default rute adalah daftar titik.
- Riwayat menjadi daftar kartu.
- Tidak boleh ada horizontal scroll pada halaman.

### Tablet: 640–1023 px

- Satu kolom lebar atau grid adaptif untuk kartu ringkasan.
- Peta dan timeline tetap satu kolom penuh.

### Desktop: ≥1024 px

- Kontainer maksimal 1200–1280 px.
- Grid utama sekitar 38% / 62%.
- Kolom kiri: ringkasan paket dan suhu aktif.
- Kolom kanan: timeline, rute, segmen, dan riwayat.

### Viewport wajib diuji

- 360 × 800
- 390 × 844
- 768 × 1024
- 1280 × 800 atau lebih besar

---

## 15. Aksesibilitas

- Gunakan heading berurutan dan landmark `header`, `main`, serta `footer`.
- Semua input memiliki label programatik.
- Semua ikon aksi memiliki accessible name.
- Kontras teks mengikuti WCAG AA.
- Informasi status tidak bergantung pada warna.
- Map toggle, accordion, pagination, copy AWB, dan refresh dapat dipakai dengan keyboard.
- Accordion menggunakan `aria-expanded` dan `aria-controls`.
- Loading memakai `aria-busy`; update dinamis diumumkan melalui live region.
- Peta tidak boleh menjebak fokus atau scroll.
- Tabel memiliki header semantik; versi mobile menggunakan struktur daftar yang setara.

---

## 16. Komponen Frontend

```text
AppShell
├─ Header
├─ AwbSearch
├─ SearchFeedback
├─ TrackingResult
│  ├─ ShipmentSummaryCard
│  ├─ ActiveTemperatureCard
│  │  └─ TemperatureRefreshButton
│  ├─ ShipmentTimeline
│  ├─ RouteSection
│  │  ├─ RouteViewToggle
│  │  ├─ IllustrativeMap
│  │  └─ RouteStopList
│  ├─ SegmentTemperatureSummary
│  └─ TemperatureHistory
├─ CustomerCareBanner
└─ Footer
```

Leaflet/React-Leaflet dipakai untuk peta ilustratif. Data garis dibagi menjadi completed, current, dan remaining. Semua nilai dan status berasal dari API; komponen tidak boleh mengarang event atau suhu.

---

## 17. Checklist Penerimaan Desain

Desain dinyatakan siap dikembangkan jika:

- [ ] seluruh contoh suhu sesuai profil aset;
- [ ] tidak ada klaim GPS/live tracking/ETA;
- [ ] tidak ada data pribadi atau data yang tidak tersedia;
- [ ] FR-02 sampai FR-05 tersusun dalam satu halaman hasil;
- [ ] riwayat tertutup secara default dan memakai pagination;
- [ ] refresh gagal mempertahankan suhu serta waktu observasi terakhir;
- [ ] cooldown terlihat dan tombol benar-benar disabled;
- [ ] delivered tidak menghasilkan suhu baru;
- [ ] peta memiliki label ilustratif dan fallback daftar titik;
- [ ] desktop, tablet, dan mobile sudah dirancang;
- [ ] semua state dapat digunakan dengan keyboard dan screen reader;
- [ ] copy publik tidak mengandung jargon sistem internal;
- [ ] logo dan kontak hanya memakai aset/informasi yang disetujui.

---

## 18. Catatan terhadap Mockup yang Ada

Mockup saat ini tetap dapat digunakan sebagai referensi visual untuk warna, komposisi, kartu, dan hierarki. Sebelum menjadi desain final, lakukan perubahan berikut:

1. ganti seluruh contoh suhu dan status yang tidak sesuai;
2. hapus GPS, ETA, bukti serah terima, berbagi status, dan data pribadi;
3. ubah peta menjadi ilustrasi titik singgah;
4. satukan FR-02 sampai FR-05 dalam satu halaman hasil;
5. sederhanakan riwayat menjadi progressive disclosure;
6. samakan terminologi dan token visual;
7. buat varian mobile dan tablet;
8. gunakan copy nonteknis untuk seluruh error.

Dokumen ini menggantikan spesifikasi desain sebelumnya sebagai acuan implementasi MVP.
