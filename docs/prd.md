# PRD — Anteraja Frozen

## Tracking Paket dan Pemantauan Suhu

**Status:** rancangan kerja, belum final · **Target pengerjaan:** 1 pengembang, ±1 bulan · **Dokumen turunan:** [FRD global](frd.md), [IA](ia.md), [DB](db.md)

## 1. Masalah

Dalam prototipe ini, pengguna perlu melihat **tahap terakhir paket** dan **kondisi suhu yang tercatat** dalam satu pengalaman tracking AWB pada layanan Anteraja Frozen. Tampilan status saja tidak memberi konteks titik singgah maupun kapan suhu terakhir dibaca. Produk yang dirancang adalah halaman tracking dengan rute ilustratif dan riwayat suhu, bukan layanan logistik lengkap. Ini adalah kebutuhan yang ingin diuji melalui prototipe, **bukan klaim** bahwa sistem Anteraja saat ini tidak mempunyai kemampuan tersebut.

Bukti awal yang tersedia adalah skenario pengujian dan data simulasi, **bukan** riset pengguna atau metrik layanan nyata. Data ini tidak terhubung ke sistem resmi Anteraja. Validasi masalah di lapangan masih diperlukan sebelum implementasi produksi.

## 2. Pengguna

| Kelompok | Kebutuhan | Jumlah yang diketahui |
|---|---|---|
| Pengunjung yang memiliki AWB | Memeriksa satu paket, tahap perjalanan, rute, dan suhu yang tercatat tanpa login. | Belum ada angka pengguna nyata; pengujian memakai data dari dataset. |
| Pengembang/pengelola pengujian | Menyiapkan seed, aset termal, dan flow Node-RED di luar UI publik. | 1 pengembang pada rencana MVP. |

Tidak ada akun pelanggan, operasi, kurir, atau admin dalam aplikasi P0.

## 3. Tujuan

MVP dinyatakan berhasil dalam pengujian bila:

1. Setiap AWB uji yang valid menampilkan **tepat satu** paket yang sesuai; AWB tidak dikenal menampilkan keadaan tidak ditemukan tanpa data paket lain.
2. Status, linimasa, dan warna rute hanya berasal dari progres yang tersedia. Pengujian mencakup paket pada tahap awal, di tengah perjalanan, dan `DELIVERED`, termasuk rute yang melewati satu atau beberapa hub serta paket yang melewati sebagian tahap.
3. Node-RED menyediakan pembacaan suhu tiap ±30 menit **dan saat pengguna menekan Refresh pada paket aktif**. Pembacaan valid tersimpan satu kali; nilai dan waktu terbaru muncul tanpa menunggu jadwal berikutnya.
4. Suhu tanpa data atau yang terlambat diberi label jelas, dan halaman tetap berguna bila peta/tile gagal dimuat.
5. Alur utama dapat digunakan pada ponsel dan desktop tanpa scanner atau login.

Ini adalah kriteria penerimaan prototipe, bukan target SLA layanan produksi. Pengujian otomatis dan contoh AWB harus disiapkan untuk membuktikannya.

## 4. Lingkup

**Termasuk (P0):** input AWB teks; lookup satu paket; nama titik pickup dan delivery; riwayat pengantaran bertanggal/jam (pickup, tiba/keluar hub, transit, pengantaran, delivered sesuai kejadian yang ada); peta rute melalui satu atau beberapa hub dengan marker pickup dan delivery serta progres pink/abu-abu; aset termal seperti cooler bag, mobil boks pendingin, atau freezer hub; suhu terbaru dan riwayat; tombol Refresh yang meminta pembacaan baru dari Node-RED untuk paket aktif; pembacaan suhu terjadwal ±30 menit; UI responsif; dataset simulasi.

**Tidak termasuk:** pemesanan/pembuatan AWB, akun dan dashboard operasi, scan kamera/barcode, input checkpoint manual, perpindahan oleh kurir, sensor IoT asli, MQTT, GPS/posisi kendaraan langsung, ETA, notifikasi, pembayaran, optimasi rute, manajemen insiden, serta integrasi Anteraja resmi. Polling otomatis dan popup hub yang lebih kaya ditunda ke P1.

Peta menampilkan urutan titik singgah ilustratif, bukan jalur jalan sebenarnya. Suhu adalah **suhu lingkungan aset termal** yang sedang menaungi paket, bukan suhu inti makanan atau bukti keamanan pangan. [Publikasi Anteraja](https://blog.anteraja.id/anteraja-frozen/) menyebut cooler bag menjaga suhu -2 sampai 5 derajat celsius dan freezer di titik operasional pada −5 hingga −2 °C.

## 5. Batasan

| Batasan | Keputusan MVP |
|---|---|
| Waktu dan tim | 1 pengembang, sekitar 4 minggu setelah data dan UI disetujui. |
| Bentuk produk | Web responsif satu halaman; tanpa aplikasi native. |
| Teknologi utama | React + TypeScript + Vite, Laravel API, PostgreSQL, Leaflet, dan Node-RED self-host; rincian di [IA](ia.md). |
| Sumber status | Seed tracking yang disiapkan, bukan event dari sensor suhu. Status tidak berubah hanya karena waktu berlalu, suhu baru, atau refresh. |
| Sumber suhu | Node-RED menyediakan pembacaan untuk aset yang ditugaskan ke paket sebagai data simulasi terkini; target interval ±30 menit, ditambah pemicu saat Refresh. Belum terhubung ke sensor fisik. |
| Tombol Refresh | Untuk paket aktif, backend meminta Node-RED membuat pembacaan **saat itu** bagi aset aktif, menyimpannya, lalu mengambil respons tracking terbaru. Untuk `DELIVERED`, hanya membaca riwayat terakhir; tidak menciptakan suhu setelah paket selesai. |
| Data dan merek | Dataset kerja untuk perancangan; tidak memuat data pribadi atau mengklaim cakupan, lokasi, armada, dan ambang resmi di luar rujukan yang disebut. |

## 6. Skala rancangan

Enam angka berikut adalah **batas desain MVP**, bukan angka lalu lintas atau kapasitas Anteraja:

| Ukuran | Nilai |
|---|---:|
| Pengembang | 1 orang |
| Durasi sasaran | ±4 minggu |
| Halaman utama publik | 1 halaman |
| Paket per pencarian | 1 AWB |
| Interval pembacaan suhu sasaran | ±30 menit |
| Riwayat suhu per respons awal | Maksimal 20 pembacaan |

Dataset kerja saat ini memuat 70 AWB, 10 titik hub, dan 86 aset. Angka ini dapat berubah selama pengembangan; volume pengguna serentak dan kebutuhan kapasitas produksi **belum ditetapkan**.

## 7. Daftar fitur

| ID | Prioritas | Fitur | Hasil singkat | Rincian |
|---|---|---|---|---|
| FR-01 | P0 | Cari AWB | Input teks dan hasil satu AWB atau pesan kesalahan. | [Spesifikasi](frd/fr-01-awb.md) |
| FR-02 | P0 | Ringkasan dan linimasa | Titik pickup/tujuan, status terakhir, serta tahap yang benar-benar tercatat. | [Spesifikasi](frd/fr-02-status.md) |
| FR-03 | P0 | Peta rute | Marker pickup, hub, dan delivery; segmen tercatat dilalui pink, sisanya abu-abu. | [Spesifikasi](frd/fr-03-peta.md) |
| FR-04 | P0 | Suhu dan riwayat | Nilai °C, “Terakhir diperbarui: jam/tanggal WIB”, jenis aset, dan pembacaan sebelumnya. | [Spesifikasi](frd/fr-04-suhu.md) |
| FR-05 | P0 | Refresh | Memicu pembacaan Node-RED saat itu untuk paket aktif, lalu menampilkan hasil; tidak memajukan status. | [Spesifikasi](frd/fr-05-perbarui.md) |
| FR-06 | P0 | Sumber suhu Node-RED | Node-RED menyediakan suhu terjadwal dan atas permintaan backend. | [Spesifikasi](frd/fr-06-suhu-node-red.md) |
| NF-01 | P0 | Web responsif | Alur utama terbaca pada ponsel dan desktop. | [IA](ia.md) |
| — | P1 | Polling otomatis/popup hub lanjutan | Peningkatan kenyamanan, bukan syarat alur inti. | Belum dirinci |

Tahap acuan: `PICKED_UP`, `AT_HUB`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`. Paket boleh melewati tahap tertentu; aplikasi tidak membuat event untuk tahap yang tidak ada di data.

## 8. Keputusan terbuka

| Keputusan | Penanggung jawab | Tenggat relatif |
|---|---|---|
| Format AWB seed dan validasi yang diterima. | Pemilik produk bersama pengembang | Sebelum implementasi FR-01 |
| Pilihan host/tile peta pengujian dan akses HTTPS bila prototipe dibuka dari luar. | Pengembang/pemilik produk | Sebelum deployment |


