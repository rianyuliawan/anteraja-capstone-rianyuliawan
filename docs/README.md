# Anteraja Frozen — Tracking Paket dan Pemantauan Suhu

Repositori dokumen ini berisi rancangan MVP pelacakan paket Anteraja Frozen. Pengguna memasukkan satu AWB untuk melihat status terakhir, riwayat perjalanan, rute melalui hub, serta suhu lingkungan aset yang terkait dengan paket. Fokusnya **tracking dan pemantauan suhu**, bukan layanan pemesanan atau pengoperasian pengiriman secara lengkap.

**Status:** tahap perancangan. PRD, FRD, arsitektur, desain UI, model data, DDL PostgreSQL, ERD, dan sample data sudah tersedia.

## Dokumen utama

| Dokumen | Isi | Urutan baca |
|---|---|---:|
| [PRD](prd.md) | Masalah, pengguna, tujuan, lingkup MVP, batasan, skala, dan prioritas fitur. | 1 |
| [FRD global](frd.md) | Peran, alur tracking, aturan bisnis, status, dan kriteria penerimaan yang berlaku lintas fitur. | 2 |
| [FRD per fitur](frd/README.md) | Rincian FR-01 sampai FR-06: cari AWB, status/linimasa, peta, suhu, Refresh, dan sumber suhu Node-RED. | 3 |
| [IA — arsitektur informasi dan aplikasi](ia.md) | Susunan halaman, React/Leaflet, Laravel, PostgreSQL, Node-RED, serta deployment. | 4 |
| [DB — model data dan ERD](db.md) | Entitas, relasi, aturan integritas, dan cara menghubungkan AWB dengan pembacaan suhu. | 5 |
| [Desain UI](ui/README.md) | Dokumentasi dan hasil desain antarmuka FR-01 sampai FR-05. | 6 |
| [Sample data database](database/sample-data/) | Sembilan CSV yang saling berelasi untuk seed PostgreSQL. | 7 |

`IA` berarti *information architecture*, bukan dokumen AI. Dokumen pada tabel di atas adalah acuan bila ada perbedaan dengan berkas lain.

## Alur produk yang dirancang

1. Pengguna mencari satu AWB tanpa login.
2. Aplikasi menampilkan status dan kejadian yang memang tercatat. Tidak setiap paket harus melewati semua tahap atau semua hub.
3. Peta Leaflet menampilkan titik pickup, hub, dan tujuan. Segmen yang sudah dilalui berwarna pink; sisanya abu-abu. Garis ini menggambarkan urutan titik singgah, **bukan posisi GPS langsung atau jalur jalan sebenarnya**.
4. Event pickup dan delivered dapat memiliki masing-masing satu foto dokumentasi yang telah lolos pemeriksaan privasi. File berada di storage privat, bukan di database.
5. Aplikasi menampilkan pembacaan suhu terakhir dan riwayatnya. Suhu melekat pada aset termal, misalnya mobil boks atau freezer hub, bukan pada AWB secara terpisah. Dua paket pada aset yang sama dan pada waktu yang sama dapat memakai satu pembacaan suhu yang sama.
6. Node-RED dirancang menyediakan pembacaan untuk aset aktif tiap ±30 menit atau saat pengguna menekan **Refresh**. Refresh suhu tidak mengubah status maupun posisi paket.

Suhu yang dimaksud adalah **suhu lingkungan aset**, bukan suhu inti produk. [Publikasi Anteraja Frozen](https://blog.anteraja.id/anteraja-frozen/) menyebut freezer di titik operasional pada −5 hingga −2 °C. Rentang −8 hingga −2 °C untuk cooler bag dan mobil boks dalam dataset adalah parameter rancangan, bukan klaim spesifikasi resmi.

## Sample data database

Folder [`database/sample-data`](database/sample-data/) memuat 70 AWB dengan variasi tahap `PICKED_UP`, `AT_HUB`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, dan `DELIVERED`. Dataset lama satu tabel telah dihapus agar tidak ada dua sumber data yang berbeda.

Relasi intinya: `shipments.awb` menghubungkan paket ke rute, kejadian, dan penugasan aset. Pembacaan suhu dihubungkan melalui `asset_code` **hanya bila** `observed_at` berada dalam rentang `started_at` sampai sebelum `ended_at` pada penugasan paket tersebut. Status paket berasal dari `shipment_events`, bukan dari suhu.

Data pada folder ini adalah contoh untuk merancang dan menguji aplikasi, bukan catatan pengiriman aktual atau data dari sistem resmi Anteraja. Nama hub, koordinat penanda area, identitas aset, dan waktu kejadian tidak boleh diperlakukan sebagai fakta operasional. Tidak ada data pribadi penerima di dalam dataset.

## Batas MVP

Termasuk: pencarian AWB, ringkasan dan linimasa, dokumentasi foto pickup/delivery, peta rute, suhu dan riwayat, Refresh suhu, sumber suhu Node-RED, serta tampilan responsif. Tidak termasuk: pembuatan pesanan, akun operasi/kurir, unggah foto dari UI publik, pemindaian barcode, sensor fisik, GPS langsung, notifikasi, pembayaran, dan integrasi dengan sistem resmi Anteraja.
