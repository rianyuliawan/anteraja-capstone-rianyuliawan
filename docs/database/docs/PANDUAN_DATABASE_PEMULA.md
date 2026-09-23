# Panduan Database Anteraja Frozen untuk Pemula

## 1. Tujuan panduan

Dokumen ini menjelaskan apa yang sudah dibuat, alasan setiap bagian dibuat, hubungan antartabel, perjalanan data dari CSV sampai tampil pada aplikasi, dan fungsi setiap baris bermakna dalam DDL.

Panduan ini dibaca bersama:

1. `anteraja_frozen_schema.sql` — membuat struktur database.
2. `anteraja_frozen_seed_transform.sql` — memindahkan data CSV dari area seed ke tabel aplikasi.
3. Folder `sample-data` — delapan CSV yang menjadi data awal.

Nomor baris dalam panduan merujuk versi SQL saat dokumen ini dibuat. Baris kosong hanya berfungsi sebagai pemisah visual dan tidak dijelaskan satu per satu.

## 2. Gambaran paling sederhana

Bayangkan database sebagai lemari arsip:

- **Database** adalah seluruh lemari.
- **Schema** adalah ruangan atau kelompok lemari.
- **Table** adalah satu laci dengan jenis dokumen tertentu.
- **Column** adalah kolom pada formulir.
- **Row** adalah satu formulir yang sudah terisi.
- **Primary key** adalah nomor internal unik setiap formulir.
- **Foreign key** adalah referensi ke formulir pada laci lain.
- **Constraint** adalah aturan yang mencegah data tidak masuk akal.
- **Index** adalah daftar isi yang mempercepat pencarian.
- **View** adalah tampilan hasil query yang disimpan definisinya, bukan salinan data baru.

Database ini mempunyai dua area:

```text
PostgreSQL: anteraja_frozen
├── public                         ← tabel yang dibaca Laravel
│   ├── shipments
│   ├── hubs
│   ├── route_stops
│   ├── shipment_events
│   ├── temperature_profiles
│   ├── thermal_assets
│   ├── shipment_asset_assignments
│   └── temperature_readings
└── seed                           ← tempat sementara delapan CSV
    ├── shipments
    ├── hubs
    ├── route_stops
    ├── shipment_events
    ├── temperature_profiles
    ├── thermal_assets
    ├── shipment_asset_assignments
    └── temperature_readings
```

Laravel seharusnya membaca tabel `public`. Schema `seed` hanya dipakai ketika menyiapkan data awal.

## 3. Mengapa dataset disebut seed

Delapan CSV bukan database. CSV adalah kumpulan data awal yang akan dimasukkan ke database. Data awal seperti ini disebut **seed data**.

Fungsinya:

- membuat aplikasi langsung mempunyai 70 AWB untuk diuji;
- menguji paket pada lima status berbeda;
- menguji rute satu, dua, dan tiga hub;
- menguji aset yang digunakan beberapa paket;
- menguji suhu normal, warning, dan critical;
- menguji paket aktif dan delivered.

Alurnya:

```text
Delapan CSV
    ↓ impor dengan DBeaver
Tabel seed.*
    ↓ jalankan seed transform
Tabel public
    ↓ dibaca Laravel API
React menampilkan tracking
```

Data Node-RED berikutnya langsung divalidasi Laravel dan dimasukkan ke `public.temperature_readings`. Node-RED tidak perlu menulis ke tabel seed.

## 4. Istilah SQL yang perlu dipahami

### `bigint GENERATED ALWAYS AS IDENTITY`

PostgreSQL membuat angka ID secara otomatis, misalnya 1, 2, 3. Aplikasi tidak perlu menentukan angkanya.

### `PRIMARY KEY`

Identitas utama sebuah baris. Nilainya harus unik dan tidak boleh kosong.

### `FOREIGN KEY`

Menjamin nilai menunjuk baris yang benar pada tabel lain. Contoh: `route_stops.shipment_id` harus menunjuk `shipments.id` yang benar-benar ada.

### `UNIQUE`

Mencegah dua baris memakai nilai yang sama. AWB dan kode aset harus unik.

### `NOT NULL`

Kolom wajib mempunyai nilai.

### `NULL`

Artinya nilai belum ada atau tidak berlaku. Contoh: `ended_at` kosong berarti assignment masih aktif.

### `DEFAULT`

Nilai otomatis bila insert tidak mengirim nilai. `CURRENT_TIMESTAMP` berarti waktu database saat itu.

### `CHECK`

Aturan logis yang harus benar sebelum baris diterima.

### `varchar(50)` dan `text`

Keduanya menyimpan teks. `varchar(50)` membatasi maksimal 50 karakter; `text` tidak memakai batas karakter praktis.

### `numeric(5,2)`

Angka desimal presisi tetap: total lima digit dengan dua digit di belakang koma. Contoh `-12.50`.

### `timestamptz`

Timestamp yang memahami zona waktu. PostgreSQL menyimpan momen waktunya secara konsisten; UI dapat menampilkannya sebagai WIB.

### `uuid`

ID panjang yang sangat sulit bertabrakan, misalnya untuk satu permintaan Refresh.

### `ON DELETE CASCADE`

Jika parent dihapus, child terkait ikut dihapus. Ini dipakai untuk data yang tidak bermakna tanpa parent-nya.

### `ON DELETE RESTRICT`

Parent tidak boleh dihapus selama masih dipakai child. Ini mencegah referensi rusak.

### `INDEX`

Struktur tambahan untuk mempercepat query. Index menambah sedikit biaya penyimpanan dan proses tulis, sehingga hanya dibuat untuk pola query penting.

### `VIEW`

Query yang diberi nama. Saat view dipanggil, PostgreSQL menghitung hasil dari tabel sumber.

### Transaction: `BEGIN` dan `COMMIT`

Semua perintah di antaranya dianggap satu pekerjaan. Jika terjadi error sebelum `COMMIT`, perubahan dapat dibatalkan sehingga database tidak setengah jadi.

## 5. Mengapa ada ID database dan ID seed

Contoh route stop pada CSV mempunyai ID `RS-00001`. Database juga membuat ID internal seperti `1`.

```text
id = 1                         ← primary key internal
seed_route_stop_id = RS-00001 ← referensi dari dataset
```

Keduanya dipertahankan karena:

- ID angka lebih sederhana dan efisien untuk relationship database;
- ID seed memudahkan mencocokkan database dengan CSV;
- data baru dari aplikasi tidak harus mengikuti format `RS-*`.

## 6. Hubungan data dari AWB ke suhu

Suhu tidak disimpan langsung pada shipment:

```text
shipments
    ↓ shipment_id
shipment_asset_assignments
    ↓ thermal_asset_id
thermal_assets
    ↓ thermal_asset_id
temperature_readings
```

Misalnya AWB A dan AWB B berada dalam mobil boks yang sama pada pukul 10.00. Mobil boks menghasilkan satu reading pukul 10.00. Kedua AWB dapat menampilkan reading yang sama selama waktu reading berada dalam interval assignment masing-masing.

Ini lebih hemat dan lebih benar daripada membuat suhu tiruan terpisah untuk setiap AWB.

## 7. Penjelasan DDL baris demi baris

Bagian ini membedah `anteraja_frozen_schema.sql`. Satu penjelasan dapat mencakup beberapa baris yang bersama-sama membentuk satu perintah SQL.

### Baris 1–13: komentar pembuka

- Baris 1 menyatakan nama proyek dan bahwa file merupakan DDL PostgreSQL.
- Baris 2 menentukan target PostgreSQL 15 atau lebih baru.
- Baris 3–4 merangkum cakupan database.
- Baris 6 menandai penjelasan dataset.
- Baris 7–9 menyebut delapan CSV yang saling berhubungan.
- Baris 9–10 menjelaskan ID teks dari seed tetap disimpan, sedangkan primary key produksi memakai angka `bigint`.
- Baris 11–13 menjelaskan bahwa snapshot shipment bukan sumber kebenaran status; event-lah sumber kebenarannya.
- Semua baris yang diawali `--` adalah komentar dan tidak dijalankan PostgreSQL.

### Baris 15: membuka transaction

`BEGIN;` memulai satu transaksi. Tujuannya agar pembuatan struktur database dianggap satu kesatuan.

### Baris 17: extension `btree_gist`

`CREATE EXTENSION IF NOT EXISTS btree_gist;` mengaktifkan kemampuan PostgreSQL yang diperlukan untuk exclusion constraint. `IF NOT EXISTS` mencegah error jika extension sudah terpasang.

Extension ini digunakan untuk melarang dua interval assignment AWB bertumpuk.

### Baris 18: schema seed

`CREATE SCHEMA IF NOT EXISTS seed;` membuat ruang bernama `seed`. Delapan tabel CSV diletakkan di ruang ini agar terpisah dari tabel aplikasi.

### Baris 20–22: komentar bagian trigger

Garis komentar hanya membuat file lebih mudah dibaca. Tidak memengaruhi database.

### Baris 24–32: fungsi `set_updated_at`

- Baris 24 membuat atau memperbarui fungsi bernama `set_updated_at`.
- Baris 25 menyatakan fungsi mengembalikan tipe khusus `trigger`.
- Baris 26 memakai bahasa prosedural PostgreSQL, `plpgsql`.
- Baris 27 dan 32 memakai `$$` sebagai pembatas isi fungsi.
- Baris 28 membuka blok program fungsi.
- Baris 29 mengubah `NEW.updated_at` menjadi waktu sekarang. `NEW` adalah versi baris setelah update.
- Baris 30 mengembalikan baris baru agar proses update dilanjutkan.
- Baris 31 menutup blok fungsi.

Fungsi ini belum berjalan sendiri. Setiap tabel yang memerlukannya harus mempunyai trigger.

### Baris 34–36: komentar reference tables

Bagian berikut berisi data acuan yang digunakan tabel lain: profil suhu dan hub.

### Baris 38–58: tabel `temperature_profiles`

- Baris 38 mulai membuat tabel.
- Baris 39 membuat `asset_type` sebagai primary key. Nilainya seperti `COOLER_BAG`.
- Baris 40 menyimpan suhu target.
- Baris 41–42 menyimpan batas bawah dan atas kondisi normal.
- Baris 43–44 menyimpan batas terluar warning.
- Baris 45 menyimpan URL sumber bila tersedia; kolom ini boleh NULL.
- Baris 46 menyimpan waktu pembuatan otomatis.
- Baris 47 menyimpan waktu perubahan terakhir otomatis.
- Baris 49 memberi nama constraint jenis aset.
- Baris 50 hanya mengizinkan tiga jenis aset yang dipakai MVP.
- Baris 51 memberi nama constraint urutan ambang.
- Baris 52 membuka ekspresi pemeriksaan.
- Baris 53 memastikan batas warning bawah lebih kecil daripada batas normal bawah.
- Baris 54 memastikan target tidak lebih rendah dari batas normal bawah.
- Baris 55 memastikan target tidak lebih tinggi dari batas normal atas.
- Baris 56 memastikan batas normal atas lebih kecil daripada batas warning atas.
- Baris 57 menutup pemeriksaan.
- Baris 58 menutup definisi tabel dengan `);`.

Contoh profil:

```text
HUB_FREEZER: normal -5 sampai -2 °C
```

### Baris 60–62: trigger profil suhu

- Baris 60 membuat trigger dengan nama yang mudah dikenali.
- Baris 61 menjalankannya sebelum row di-update.
- Baris 62 menjalankan fungsi `set_updated_at` untuk setiap row.

Akibatnya, perubahan profil otomatis memperbarui `updated_at`.

### Baris 64–78: tabel `hubs`

- Baris 64 mulai membuat master hub.
- Baris 65 membuat ID angka otomatis sebagai primary key.
- Baris 66 menyimpan kode hub dan mewajibkan nilainya.
- Baris 67 menyimpan nama yang tampil di UI.
- Baris 68 menyimpan area umum.
- Baris 69–70 menyimpan latitude dan longitude dengan enam angka desimal.
- Baris 71–72 menyimpan waktu buat dan waktu ubah.
- Baris 74 memastikan kode hub unik.
- Baris 75 menggunakan regular expression untuk membatasi kode ke huruf kapital, angka, dan tanda hubung.
- Baris 76 membatasi latitude dari −90 sampai 90.
- Baris 77 membatasi longitude dari −180 sampai 180.
- Baris 78 menutup tabel.

### Baris 80–82: trigger hub

Trigger ini sama prinsipnya dengan trigger profil: setiap update hub memperbarui `updated_at`.

### Baris 84–86: komentar shipment dan route

Bagian berikut mulai menyimpan paket, rute, dan kejadian.

### Baris 88–101: tabel `shipments`

- Baris 88 mulai membuat tabel paket.
- Baris 89 membuat ID internal otomatis.
- Baris 90 menyimpan AWB.
- Baris 91 menyimpan area pickup.
- Baris 92 menyimpan nama titik/kawasan pickup.
- Baris 93 menyimpan area tujuan.
- Baris 94 menyimpan nama titik/kawasan tujuan.
- Baris 95–96 menyimpan waktu buat dan ubah.
- Baris 98 memastikan satu AWB hanya muncul satu kali.
- Baris 99 memberi nama pemeriksaan format AWB.
- Baris 100 menerima huruf kapital, angka, dan tanda hubung dengan panjang yang sesuai.
- Baris 101 menutup tabel.

`current_stage` sengaja tidak disimpan pada tabel produksi ini. Status dihitung dari event terbaru agar tidak ada dua sumber kebenaran.

### Baris 103–105: trigger shipment

Setiap perubahan konteks shipment otomatis memperbarui `updated_at`.

### Baris 107–136: tabel `route_stops`

- Baris 107 mulai membuat titik rute.
- Baris 108 membuat ID internal.
- Baris 109 menyimpan ID `RS-*` dari seed; data runtime boleh tidak memilikinya.
- Baris 110 menyimpan foreign key ke shipment dan wajib ada.
- Baris 111 menyimpan foreign key hub; boleh NULL untuk pickup/delivery.
- Baris 112 menyimpan urutan titik: 0, 1, 2, dan seterusnya.
- Baris 113 menyimpan tipe titik.
- Baris 114 menyimpan nama yang ditampilkan.
- Baris 115–116 menyimpan koordinat marker.
- Baris 117–118 menyimpan waktu buat dan ubah.
- Baris 120–121 membuat foreign key shipment. `CASCADE` berarti stop ikut terhapus jika shipment dihapus.
- Baris 122–123 membuat foreign key hub. `RESTRICT` mencegah hub dihapus jika masih dipakai rute.
- Baris 124 membuat ID seed unik.
- Baris 125 melarang dua stop pada shipment yang sama mempunyai urutan sama.
- Baris 126 melarang urutan negatif.
- Baris 127–128 hanya menerima `PICKUP`, `HUB`, atau `DELIVERY`.
- Baris 129–133 memastikan stop HUB memiliki `hub_id`, sedangkan pickup/delivery tidak memilikinya.
- Baris 134–135 memeriksa rentang koordinat.
- Baris 136 menutup tabel.

### Mengapa tidak ada index rute tambahan

Constraint `route_stops_order_uq` pada baris 125 secara otomatis membuat index unik PostgreSQL untuk pasangan `(shipment_id, stop_order)`. Index tersebut sudah dapat dipakai untuk mengambil titik rute satu AWB dalam urutan yang benar, sehingga tidak dibuat index kedua dengan kolom yang sama. Ini menghemat ruang penyimpanan dan mengurangi pekerjaan database setiap kali route stop ditambah atau diperbarui.

### Baris 138–140: trigger route stop

Setiap update route stop memperbarui `updated_at`.

### Baris 142–189: tabel `shipment_events`

- Baris 142 mulai membuat histori event.
- Baris 143 membuat ID internal.
- Baris 144 menyimpan ID `EV-*` dari seed.
- Baris 145 menunjuk shipment pemilik event.
- Baris 146 menunjuk hub bila event terjadi di hub.
- Baris 147 menyimpan tahap umum untuk UI.
- Baris 148 menyimpan kode kejadian yang lebih spesifik.
- Baris 149 menyimpan waktu kejadian sebenarnya.
- Baris 150 menyimpan urutan stop terakhir yang telah dicapai.
- Baris 151 menyimpan sumber event dan memberi default `SEED`.
- Baris 152 menyimpan key sumber untuk deduplikasi.
- Baris 153 menyimpan waktu row dimasukkan ke database.
- Baris 155–156 membuat foreign key shipment dengan penghapusan cascade.
- Baris 157–158 membuat foreign key hub dengan penghapusan restrict.
- Baris 159 membuat ID seed unik.
- Baris 160–163 membuat foreign key gabungan. Shipment dan `completed_stop_order` harus menunjuk stop dari shipment yang sama.
- Baris 164–168 membatasi lima nilai tahap.
- Baris 169–173 membatasi enam kode kejadian.
- Baris 174–181 memeriksa pasangan event–stage. Contohnya `ARRIVED_HUB` harus menghasilkan tahap `AT_HUB`.
- Baris 182–186 mewajibkan `hub_id` untuk event tiba/keluar hub.
- Baris 187–188 melarang stop selesai bernilai negatif, tetapi tetap mengizinkan NULL jika tidak relevan.
- Baris 189 menutup tabel.

`stage` dan `event_code` berbeda. `stage=IN_TRANSIT` dapat berasal dari event `LEFT_HUB` atau `IN_TRANSIT`.

### Baris 191–193: unique partial index event

Kombinasi `source` dan `source_event_key` harus unik ketika key tersedia. Klausa `WHERE ... IS NOT NULL` berarti row tanpa key tidak ikut aturan index ini.

### Baris 195–196: index event terbaru

Index mengurutkan event per shipment dari waktu terbaru. `id DESC` menjadi pemutus jika dua event mempunyai timestamp sama.

### Baris 198–200: index event hub

Index mempercepat query event pada hub tertentu. Hanya row yang mempunyai `hub_id` yang dimasukkan ke index agar ukurannya lebih kecil.

### Baris 202–204: komentar bagian thermal

Bagian berikut menangani aset dan pembacaan suhu.

### Baris 206–222: tabel `thermal_assets`

- Baris 206 mulai membuat master aset.
- Baris 207 membuat ID internal.
- Baris 208 menyimpan kode aset seperti `BAG-001`.
- Baris 209 menyimpan jenis aset.
- Baris 210 menyimpan nama tampilan.
- Baris 211 menandai aset masih aktif dan default-nya `true`.
- Baris 212–213 menyimpan waktu buat dan ubah.
- Baris 215 membuat kode aset unik.
- Baris 216–219 membuat foreign key jenis aset ke profil suhu. Jika nama tipe profil berubah, nilai pada aset ikut berubah karena `ON UPDATE CASCADE`. Profil tidak boleh dihapus selama masih dipakai.
- Baris 220–221 memeriksa format kode aset.
- Baris 222 menutup tabel.

### Baris 224–225: index jenis aset aktif

Index mempercepat pencarian aset aktif berdasarkan jenisnya.

### Baris 227–229: trigger aset

Setiap perubahan aset memperbarui `updated_at`.

### Baris 231–260: tabel `shipment_asset_assignments`

- Baris 231 mulai membuat tabel penghubung shipment–aset.
- Baris 232 membuat ID internal.
- Baris 233 menyimpan ID `AS-*` dari seed.
- Baris 234 menunjuk shipment.
- Baris 235 menunjuk aset.
- Baris 236 menyimpan segmen perjalanan.
- Baris 237 menyimpan waktu assignment dimulai.
- Baris 238 menyimpan waktu berakhir; NULL berarti masih aktif.
- Baris 239–240 menghasilkan kolom range waktu otomatis. Bentuk `[)` berarti waktu mulai termasuk, waktu akhir tidak termasuk.
- Baris 241–242 menyimpan waktu buat dan ubah.
- Baris 244–245 membuat foreign key shipment dengan cascade.
- Baris 246–247 membuat foreign key aset dengan restrict.
- Baris 248 membuat ID seed unik.
- Baris 249–250 membatasi empat jenis segmen.
- Baris 251–252 memastikan waktu akhir kosong atau lebih besar daripada waktu mulai.
- Baris 253 melarang dua assignment shipment dimulai pada timestamp yang sama.
- Baris 254 memberi nama exclusion constraint.
- Baris 255 memilih index GiST.
- Baris 256 meminta PostgreSQL membandingkan `shipment_id` yang sama.
- Baris 257 memakai operator overlap `&&` untuk range waktu.
- Baris 258 menutup daftar pembanding.
- Baris 259 membuat pemeriksaan dapat ditunda sampai akhir transaksi bila aplikasi memerlukannya.
- Baris 260 menutup tabel.

Inti baris 254–259: satu AWB tidak boleh berada pada dua aset pada waktu yang bertumpuk.

### Baris 262–263: index assignment berdasarkan aset dan periode

Index GiST mempercepat pertanyaan seperti “AWB apa saja yang berada di aset ini pada pukul tertentu?”.

### Baris 265–267: index assignment aktif berdasarkan aset

Index parsial ini hanya berisi assignment dengan `ended_at IS NULL`. Ia mempercepat pertanyaan seperti “AWB apa saja yang sedang berada di mobil boks ini?” tanpa memperbesar index dengan histori yang sudah selesai.

### Baris 269–271: unique index aset aktif per shipment

Index parsial unik ini mempercepat pencarian aset yang saat ini menangani suatu AWB. Sifat `UNIQUE` juga memastikan satu shipment tidak dapat mempunyai lebih dari satu assignment aktif (`ended_at IS NULL`) pada saat yang sama.

### Baris 273–275: trigger assignment

Perubahan assignment memperbarui `updated_at`.

### Baris 277–313: tabel `temperature_readings`

- Baris 277 mulai membuat pembacaan suhu.
- Baris 278 membuat ID internal.
- Baris 279 menyimpan ID `TR-*` dari seed.
- Baris 280 menunjuk aset yang menghasilkan reading.
- Baris 281 menyimpan sumber: seed, Node-RED, atau IoT kelak.
- Baris 282 menyimpan ID pesan untuk idempotensi.
- Baris 283 menyimpan UUID permintaan Refresh bila reading bersifat on-demand.
- Baris 284 menyimpan tipe pemicu.
- Baris 285 menyimpan waktu suhu diamati.
- Baris 286 menyimpan waktu backend menerima suhu.
- Baris 287 menyimpan suhu Celsius.
- Baris 288 menyimpan hasil klasifikasi; boleh NULL jika profil belum tersedia.
- Baris 289 menyimpan waktu row dibuat.
- Baris 291–292 membuat foreign key ke aset.
- Baris 293 membuat ID seed unik.
- Baris 294 membuat kombinasi sumber dan message ID unik agar retry tidak menggandakan data.
- Baris 295–296 membatasi sumber data.
- Baris 297–298 membatasi jenis trigger.
- Baris 299–303 membatasi status suhu bila nilainya tidak NULL.
- Baris 304–305 membatasi suhu ke rentang masuk akal −100 sampai 100 °C.
- Baris 306–307 mengizinkan toleransi perbedaan jam lima menit, tetapi mencegah `received_at` terlalu jauh mendahului `observed_at`.
- Baris 308–312 mewajibkan `request_id` hanya untuk `ON_DEMAND`.
- Baris 313 menutup tabel.

### Baris 315–317: unique index request Refresh

Untuk aset yang sama, satu `request_id` hanya boleh menghasilkan satu reading. Row tanpa request ID tidak masuk index.

### Baris 319–320: index reading terbaru

Index mempercepat pencarian reading terbaru dari suatu aset.

### Baris 322–324: index anomali

Index hanya memuat warning dan critical sehingga pencarian anomali tidak perlu membaca seluruh reading normal.

### Baris 326–329: komentar raw seed tables

Bagian berikut membuat area pendaratan CSV. Tabel seed sengaja lebih dekat dengan bentuk CSV dan tidak dipakai langsung oleh aplikasi.

### Baris 331–359: `seed.shipments`

- Baris 331 membuat tabel shipment di schema seed.
- Baris 332–336 menyalin AWB dan konteks pickup/delivery dari CSV.
- Baris 337 menyimpan status snapshot dari CSV.
- Baris 338–339 menyimpan waktu pickup dan waktu status terakhir.
- Baris 340 menyimpan stop yang telah selesai.
- Baris 341 menyimpan jumlah hub pada rute.
- Baris 342 menyimpan key skenario dataset.
- Baris 343 mencatat kapan row dimuat.
- Baris 345 menjadikan AWB primary key pada area seed.
- Baris 346–350 memeriksa lima tahap yang diizinkan.
- Baris 351–352 memastikan status terakhir tidak lebih awal dari pickup.
- Baris 353–354 melarang completed stop negatif.
- Baris 355–356 melarang jumlah hub negatif.
- Baris 357–358 memastikan `scenario_key` konsisten dengan stage dan jumlah hub.
- Baris 359 menutup tabel.

### Baris 361–368: `seed.hubs`

- Baris 361 membuat tabel raw hub.
- Baris 362 memakai `hub_code` CSV sebagai primary key seed.
- Baris 363–366 menyimpan nama, area, dan koordinat.
- Baris 367 mencatat waktu import.
- Baris 368 menutup tabel.

### Baris 370–382: `seed.route_stops`

- Baris 370 membuat tabel raw route stop.
- Baris 371 memakai ID `RS-*` sebagai primary key seed.
- Baris 372 menyimpan AWB dalam bentuk teks karena belum diubah menjadi ID internal.
- Baris 373–378 menyimpan urutan, tipe titik, kode hub, nama, dan koordinat.
- Baris 379 menyimpan waktu import.
- Baris 381 melarang AWB mempunyai dua stop dengan urutan sama.
- Baris 382 menutup tabel.

### Baris 384–394: `seed.shipment_events`

- Baris 384 membuat tabel raw event.
- Baris 385 memakai ID `EV-*` sebagai primary key seed.
- Baris 386–391 menyalin AWB, kode event, stage, waktu, hub, dan completed stop.
- Baris 392 mewajibkan source event key dan membuatnya unik.
- Baris 393 mencatat waktu import.
- Baris 394 menutup tabel.

### Baris 396–405: `seed.temperature_profiles`

- Baris 396 membuat tabel raw profil.
- Baris 397 memakai jenis aset sebagai primary key.
- Baris 398–402 menyalin target dan empat batas suhu.
- Baris 403 menyimpan URL sumber bila ada.
- Baris 404 mencatat waktu import.
- Baris 405 menutup tabel.

### Baris 407–412: `seed.thermal_assets`

- Baris 407 membuat tabel raw aset.
- Baris 408 memakai kode aset sebagai primary key.
- Baris 409–410 menyimpan tipe dan nama tampilan.
- Baris 411 mencatat waktu import.
- Baris 412 menutup tabel.

### Baris 414–423: `seed.shipment_asset_assignments`

- Baris 414 membuat tabel raw assignment.
- Baris 415 memakai ID `AS-*` sebagai primary key.
- Baris 416–418 menyimpan AWB, kode aset, dan tipe aset dari CSV.
- Baris 419 menyimpan segmen.
- Baris 420–421 menyimpan waktu mulai dan selesai.
- Baris 422 mencatat waktu import.
- Baris 423 menutup tabel.

`asset_type` tetap ada di seed untuk memeriksa konsistensi CSV, tetapi tidak diduplikasi di tabel assignment produksi karena dapat dibaca dari master aset.

### Baris 425–439: `seed.temperature_readings`

- Baris 425 membuat tabel raw reading.
- Baris 426 memakai ID `TR-*` sebagai primary key.
- Baris 427–435 menyalin aset, sumber, message ID, request ID, trigger, waktu, suhu, dan status.
- Baris 436 mencatat waktu import.
- Baris 438 membuat kombinasi sumber dan message ID unik.
- Baris 439 menutup tabel.

Ketika mengimpor dengan DBeaver, kolom CSV bernama `trigger` dipetakan ke `trigger_type`.

### Baris 441–442: komentar pada schema

`COMMENT ON SCHEMA` menyimpan dokumentasi di metadata PostgreSQL. Komentar ini dapat dilihat melalui DBeaver.

### Baris 444–454: komentar kolom ID seed

Empat pasangan baris menambahkan penjelasan metadata untuk `seed_route_stop_id`, `seed_event_id`, `seed_assignment_id`, dan `seed_reading_id`.

### Baris 456–458: komentar bagian view

Bagian terakhir membuat view yang mempermudah query Laravel.

### Baris 460–469: view `shipment_current_status`

- Baris 460 membuat view.
- Baris 461 memakai `DISTINCT ON (shipment_id)` agar hasil hanya satu event per shipment.
- Baris 462 mengembalikan ID shipment.
- Baris 463 memberi nama output `current_stage`.
- Baris 464 memberi nama output `current_event_code`.
- Baris 465 memberi nama waktu terakhir.
- Baris 466–467 mengembalikan completed stop dan ID event.
- Baris 468 mengambil data dari `shipment_events` dengan alias `e`.
- Baris 469 mengurutkan setiap shipment dari waktu dan ID terbaru. Karena `DISTINCT ON` mengambil row pertama, hasilnya adalah event terakhir.

### Baris 471–490: view `shipment_temperature_history`

- Baris 471 membuat view histori suhu per shipment.
- Baris 472 mulai memilih kolom.
- Baris 473–476 mengembalikan shipment, assignment, segmen, dan aset.
- Baris 477–478 mengambil kode dan tipe aset.
- Baris 479–484 mengambil ID reading, waktu, suhu, status, sumber, dan trigger.
- Baris 485 memakai assignment sebagai titik awal query.
- Baris 486–487 menghubungkan assignment dengan master aset.
- Baris 488–489 menghubungkan reading yang memiliki aset sama.
- Baris 490 menambahkan syarat waktu: `observed_at <@ active_period`. Operator `<@` berarti waktu reading berada di dalam range assignment.

Baris 490 adalah aturan utama yang mencegah reading muncul pada AWB di luar masa penugasannya.

### Baris 492–507: view `shipment_latest_temperature`

- Baris 492 membuat view suhu terbaru per shipment.
- Baris 493 memakai `DISTINCT ON` agar hanya satu reading per shipment.
- Baris 494–505 mengembalikan informasi assignment, aset, reading, suhu, dan status.
- Baris 506 membaca dari view histori sebelumnya.
- Baris 507 mengurutkan reading dari yang terbaru. ID reading menjadi pemutus jika waktunya sama.

### Baris 509–513: komentar view

Dua `COMMENT ON VIEW` menyimpan arti view dalam metadata database.

### Baris 515: menyelesaikan DDL

`COMMIT;` mengesahkan seluruh pembuatan schema, tabel, constraint, index, trigger, dan view.

## 8. Penjelasan skrip transformasi seed

File `anteraja_frozen_seed_transform.sql` bukan DDL utama. File ini berisi DML karena memindahkan dan memperbarui data. Berikut penjelasan berurutan agar alurnya dapat dipahami.

### Baris 1–3: prasyarat

Komentar menjelaskan bahwa DDL harus dijalankan lebih dahulu dan delapan CSV harus sudah masuk ke schema seed.

### Baris 5: transaction transformasi

`BEGIN;` memastikan seluruh import produksi berhasil bersama-sama atau dibatalkan bersama-sama.

### Baris 7–21: pemeriksaan tipe aset assignment

- `DO $$` menjalankan blok program sementara.
- Variabel `mismatch_count` menyimpan jumlah masalah.
- Query menghitung assignment yang kode asetnya tidak dikenal atau tipe asetnya berbeda dari master seed.
- Jika jumlah lebih dari nol, `RAISE EXCEPTION` menghentikan transformasi.

Pemeriksaan ini diperlukan karena `asset_type` pada CSV assignment tidak disimpan ulang pada tabel produksi.

### Baris 23–37: memindahkan profil suhu

- `INSERT INTO` menentukan tabel dan kolom tujuan.
- `SELECT ... FROM seed.temperature_profiles` mengambil data raw.
- `nullif(source_url, '')` mengubah string kosong menjadi NULL.
- `ON CONFLICT (asset_type) DO UPDATE` membuat script dapat dijalankan ulang. Profil yang sudah ada diperbarui, bukan diduplikasi.
- `EXCLUDED` berarti nilai baru yang semula akan dimasukkan.

### Baris 39–46: memindahkan hub

Kode, nama, area, dan koordinat dipindahkan. Jika kode hub sudah ada, datanya diperbarui.

### Baris 48–54: memindahkan aset

Aset dipindahkan setelah profil karena `thermal_assets.asset_type` mempunyai foreign key ke profil. Aset yang diimpor ulang ditandai aktif.

### Baris 56–65: memindahkan shipment

Hanya identitas dan konteks pickup/delivery yang masuk tabel produksi. `current_stage` tidak disalin karena akan dihitung dari event.

### Baris 67–90: memindahkan route stops

- `JOIN shipments` mengubah AWB teks menjadi `shipments.id`.
- `LEFT JOIN hubs` mengubah hub code menjadi `hubs.id`; pickup/delivery tetap boleh NULL.
- ID `RS-*` masuk ke `seed_route_stop_id`.
- Jika ID seed sudah ada, row produksi diperbarui.

### Baris 92–117: memindahkan shipment events

- AWB dan hub code diubah menjadi ID internal melalui join.
- `source` diisi literal `'SEED'` karena event berasal dari dataset awal.
- ID `EV-*` disimpan sebagai `seed_event_id`.
- Event yang sudah ada diperbarui saat script dijalankan ulang.

Event dimasukkan setelah route stop karena event mempunyai foreign key ke `(shipment_id, completed_stop_order)`.

### Baris 119–138: memindahkan assignments

- AWB diubah menjadi shipment ID.
- Asset code diubah menjadi thermal asset ID.
- Waktu dan segmen dipindahkan.
- Exclusion constraint pada tabel produksi otomatis menolak overlap.

### Baris 140–167: memindahkan temperature readings

- Asset code diubah menjadi asset ID.
- ID `TR-*` disimpan sebagai `seed_reading_id`.
- Message ID, request ID, trigger, waktu, nilai, dan status dipindahkan.
- Pembacaan yang sudah ada diperbarui saat script dijalankan ulang.

### Baris 169–203: rekonsiliasi hasil

Blok program ini melakukan dua pemeriksaan setelah semua data masuk:

1. Baris 173–186 membandingkan snapshot shipment dengan view event terbaru. Stage, waktu terakhir, dan completed stop harus sama.
2. Baris 188–201 menghitung jumlah stop HUB per shipment dan membandingkannya dengan `route_hub_count` pada CSV.

Jika salah satu pemeriksaan menemukan perbedaan, `RAISE EXCEPTION` menghentikan transaksi.

### Baris 205: menyelesaikan transformasi

`COMMIT;` mengesahkan seluruh insert dan update.

### Baris 207–210: jumlah yang diharapkan

Komentar terakhir menjadi panduan verifikasi jumlah row setelah seed berhasil.

## 9. Contoh perjalanan satu data

Misalkan dataset mempunyai AWB `ANT-FRZ-0002`.

### Tahap 1: CSV

`shipments.csv` menyimpan ringkasan AWB. `route_stops.csv` menyimpan pickup, hub, dan delivery. `shipment_events.csv` menyimpan kejadian yang sudah terjadi.

### Tahap 2: schema seed

DBeaver memasukkan nilai CSV tanpa mengubah hubungan kode:

```text
seed.shipments.awb = ANT-FRZ-0002
seed.route_stops.awb = ANT-FRZ-0002
seed.shipment_events.awb = ANT-FRZ-0002
```

### Tahap 3: transformasi

Skrip mencari:

```text
shipments.id untuk awb ANT-FRZ-0002
```

Misalnya hasilnya `id=2`. Route stop, event, dan assignment produksi kemudian menyimpan `shipment_id=2`.

### Tahap 4: API tracking

Laravel mencari shipment berdasarkan AWB, mengambil event terbaru, route stops, assignment, serta reading yang waktunya berada dalam interval assignment.

## 10. Mengapa beberapa aturan tidak diletakkan di database

Database sangat baik untuk aturan seperti unique, foreign key, rentang angka, dan larangan overlap. Beberapa aturan proses lebih mudah dipahami serta diuji di Laravel:

- route pertama harus pickup dan terakhir harus delivery;
- event baru tidak boleh ditambahkan setelah delivered;
- assignment aktif harus ditutup ketika delivered;
- status suhu dihitung dari profil yang aktif;
- tombol Refresh mempunyai cooldown;
- permintaan serentak ke aset yang sama digabungkan;
- pesan error untuk pengguna.

Ini bukan kekurangan database. Pembagian ini menjaga database fokus pada integritas data dan Laravel fokus pada alur aplikasi.

## 11. Urutan menjalankan semuanya

```text
1. Pasang dan jalankan PostgreSQL
2. Buat database anteraja_frozen
3. Jalankan anteraja_frozen_schema.sql
4. Pastikan schema public dan seed muncul di DBeaver
5. Impor delapan CSV ke tabel seed yang sesuai
6. Peta kolom CSV trigger ke trigger_type
7. Jadikan string kosong sebagai NULL
8. Jalankan anteraja_frozen_seed_transform.sql
9. Periksa jumlah row
10. Uji satu AWB
11. Hubungkan Laravel melalui .env
```

Jangan menjalankan seed transform sebelum seluruh CSV selesai diimpor.

## 12. Query belajar yang aman

### Melihat lima shipment

```sql
SELECT *
FROM shipments
LIMIT 5;
```

### Mencari shipment berdasarkan AWB

```sql
SELECT *
FROM shipments
WHERE awb = 'ANT-FRZ-0002';
```

### Melihat event satu AWB

```sql
SELECT
    s.awb,
    e.event_code,
    e.stage,
    e.occurred_at
FROM shipments s
JOIN shipment_events e ON e.shipment_id = s.id
WHERE s.awb = 'ANT-FRZ-0002'
ORDER BY e.occurred_at, e.id;
```

### Melihat status terbaru

```sql
SELECT
    s.awb,
    cs.current_stage,
    cs.last_stage_at
FROM shipments s
JOIN shipment_current_status cs ON cs.shipment_id = s.id
WHERE s.awb = 'ANT-FRZ-0002';
```

### Melihat suhu yang sah untuk satu AWB

```sql
SELECT
    s.awb,
    h.asset_code,
    h.asset_type,
    h.temperature_c,
    h.temperature_status,
    h.observed_at
FROM shipments s
JOIN shipment_temperature_history h ON h.shipment_id = s.id
WHERE s.awb = 'ANT-FRZ-0002'
ORDER BY h.observed_at DESC
LIMIT 20;
```

Semua query di atas hanya membaca data karena menggunakan `SELECT`.

## 13. Kesalahan umum yang perlu dihindari

- Jangan menyimpan `current_stage` sebagai status kedua yang diubah terpisah dari event.
- Jangan memasukkan satu reading baru untuk setiap AWB pada aset yang sama.
- Jangan menghapus profil suhu yang masih digunakan aset.
- Jangan mengisi `ended_at` sama atau lebih awal daripada `started_at`.
- Jangan memakai waktu lokal tanpa zona yang jelas.
- Jangan mengimpor string kosong ke kolom UUID.
- Jangan memberi akses browser langsung ke PostgreSQL atau Node-RED.
- Jangan memasukkan password asli ke repository.
- Jangan menjalankan DDL dan Laravel migration untuk membuat tabel yang sama tanpa memilih satu sumber schema.

## 14. Apa yang belum dilakukan oleh SQL ini

SQL ini menyiapkan struktur dan seed, tetapi belum:

- membuat endpoint Laravel;
- membuat flow Node-RED;
- mengubah event tracking secara otomatis;
- membuat autentikasi perangkat IoT;
- membuat backup otomatis;
- membuat retention atau partisi reading untuk skala besar;
- menjalankan database cloud.

Semua itu merupakan tahap implementasi setelah rancangan database dipahami dan diuji secara lokal.

## 15. Cara belajar yang disarankan

Jalankan proses secara bertahap melalui DBeaver:

1. Buka setiap tabel dan cocokkan kolomnya dengan penjelasan ini.
2. Mulai dari satu AWB dan ikuti `shipment → route → event → assignment → asset → reading`.
3. Jalankan query `SELECT` pada bagian sebelumnya.
4. Coba pahami satu constraint pada satu waktu.
5. Jangan mengubah atau menghapus data sebelum terbiasa dengan query baca.

Jika sudah memahami alur satu AWB, struktur keseluruhan database akan jauh lebih mudah dipahami karena AWB lain mengikuti pola relationship yang sama.
