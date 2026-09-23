# Analisis Database Anteraja Frozen

**Acuan:** `db.md`, PRD/FRD, dan delapan CSV pada dataset 70 AWB.

## Ringkasan keputusan

- DBMS: PostgreSQL 15 atau lebih baru.
- Model produksi terdiri dari delapan entitas utama dan satu tabel staging shipment.
- Status paket berasal dari event terbaru, bukan kolom snapshot `current_stage`.
- Pembacaan suhu dimiliki aset termal. Hubungan suhu ke AWB ditentukan oleh interval assignment.
- ID seperti `RS-*`, `EV-*`, `AS-*`, dan `TR-*` dipertahankan sebagai ID seed unik. Primary key internal tetap `bigint identity`.
- Semua waktu produksi menggunakan `timestamptz` dan dataset sumber menggunakan UTC.

## Dataset yang diperiksa

| Dataset | Baris | Tujuan |
|---|---:|---|
| `shipments.csv` | 70 | Satu snapshot ringkas per AWB. |
| `hubs.csv` | 10 | Master hub dan koordinat penanda. |
| `route_stops.csv` | 266 | Urutan pickup, hub, dan delivery setiap AWB. |
| `shipment_events.csv` | 274 | Riwayat perpindahan tahap beserta waktunya. |
| `thermal_assets.csv` | 86 | Cooler bag, freezer hub, dan mobil boks. |
| `shipment_asset_assignments.csv` | 260 | Periode AWB berada pada suatu aset. |
| `temperature_profiles.csv` | 3 | Target dan ambang suhu per jenis aset. |
| `temperature_readings_seed.csv` | 400 | Pembacaan suhu awal per aset. |

Total dataset terdiri dari **1.369 baris data** di delapan CSV.

Distribusi penting:

- Lima tahap shipment masing-masing mempunyai 14 AWB.
- Rute: 28 AWB melewati satu hub, 28 melewati dua hub, dan 14 melewati tiga hub.
- Aset: 70 `COOLER_BAG`, 10 `HUB_FREEZER`, dan 6 `MOBIL_BOX`.
- Assignment: 70 `PICKUP`, 88 `AT_HUB`, 74 `IN_TRANSIT`, dan 28 `LAST_MILE`.
- Event: 70 pickup, 88 tiba di hub, 74 keluar/transit dari hub, 28 keluar untuk pengantaran, dan 14 delivered.
- Suhu: 361 `NORMAL`, 30 `WARNING`, dan 9 `CRITICAL`.
- Terdapat 56 assignment aktif, sesuai 56 AWB yang belum delivered.

## Hasil pemeriksaan integritas

Seluruh pemeriksaan berikut menghasilkan nol kesalahan:

- primary/natural key pada setiap CSV unik;
- seluruh AWB pada route, event, dan assignment ditemukan di shipments;
- seluruh `hub_code` ditemukan di master hubs;
- seluruh `asset_code` ditemukan di thermal assets;
- seluruh `asset_type` sesuai temperature profile;
- `asset_type` pada assignment sama dengan tipe aset master;
- urutan route stop dimulai dari 0, berurutan, diawali pickup, dan diakhiri delivery;
- jumlah stop HUB sama dengan `route_hub_count` pada shipment;
- tahap, waktu terakhir, dan stop selesai pada shipment sama dengan event terakhir;
- setiap shipment memiliki tepat satu event pickup yang sesuai `pickup_at`;
- tidak ada event setelah delivered;
- tidak ada interval assignment satu AWB yang tumpang tindih;
- AWB delivered tidak mempunyai assignment terbuka;
- setiap AWB aktif mempunyai tepat satu assignment terbuka;
- `received_at` pembacaan tidak mendahului `observed_at`;
- aturan `request_id` dan trigger konsisten;
- seluruh label temperatur sesuai ambang profil aset.

## Entitas produksi

### 1. `shipments`

Satu baris per AWB. Menyimpan konteks pickup dan delivery. Kolom ringkasan seperti `current_stage` tidak menjadi sumber kebenaran karena dapat diturunkan dari `shipment_events`.

### 2. `hubs`

Master hub dengan kode, nama tampilan, area, dan koordinat penanda.

### 3. `route_stops`

Urutan titik rute per AWB. Setiap rute memiliki satu pickup, nol atau lebih hub, dan satu delivery. `seed_route_stop_id` mempertahankan ID `RS-*`.

### 4. `shipment_events`

Riwayat kejadian tracking. Menyimpan tahap, kode kejadian, waktu, hub bila relevan, dan stop yang sudah dicapai. `seed_event_id` mempertahankan ID `EV-*`.

### 5. `temperature_profiles`

Target dan ambang temperatur per jenis aset. Profil dipisahkan dari aset agar satu aturan dapat dipakai banyak aset.

### 6. `thermal_assets`

Master cooler bag, freezer hub, dan mobil boks. Satu aset dapat menaungi beberapa AWB pada waktu yang sama.

### 7. `shipment_asset_assignments`

Relasi temporal AWB dengan aset. Satu AWB hanya boleh mempunyai satu aset aktif pada satu waktu, tetapi satu aset boleh mempunyai banyak AWB. `seed_assignment_id` mempertahankan ID `AS-*`.

### 8. `temperature_readings`

Pembacaan suhu per aset dan waktu. Pembacaan tidak digandakan untuk setiap paket. `seed_reading_id` mempertahankan ID `TR-*`, sedangkan `source + message_id` menjamin idempotensi ingest.

### 9. `shipment_import_staging`

Menampung `shipments.csv` yang berisi snapshot terdenormalisasi. Nilai `current_stage`, `last_stage_at`, `completed_stop_order`, dan `route_hub_count` dipakai untuk rekonsiliasi, bukan menjadi sumber kebenaran produksi.

## Relationship

| Parent | Kardinalitas | Child | Aturan |
|---|---|---|---|
| `shipments` | 1:N | `route_stops` | Satu AWB mempunyai beberapa titik rute. |
| `hubs` | 1:N opsional | `route_stops` | Stop bertipe HUB wajib merujuk hub. |
| `shipments` | 1:N | `shipment_events` | Status terbaru berasal dari event terbaru. |
| `hubs` | 1:N opsional | `shipment_events` | Event tiba/keluar hub wajib merujuk hub. |
| `temperature_profiles` | 1:N | `thermal_assets` | Satu profil digunakan banyak aset sejenis. |
| `shipments` | 1:N | `shipment_asset_assignments` | Satu AWB dapat berganti aset selama perjalanan. |
| `thermal_assets` | 1:N | `shipment_asset_assignments` | Satu aset dapat membawa beberapa AWB. |
| `thermal_assets` | 1:N | `temperature_readings` | Pembacaan dicatat satu kali per aset. |

Hubungan AWB dengan suhu:

```text
shipments
  → shipment_asset_assignments
  → thermal_assets
  → temperature_readings
```

Pembacaan hanya tampil pada AWB jika `observed_at` berada dalam interval assignment `[started_at, ended_at)`.

## Pemetaan CSV ke database

| CSV | Tabel tujuan | Transformasi utama |
|---|---|---|
| shipments | `shipment_import_staging`, lalu `shipments` | AWB menjadi natural key; kolom snapshot direkonsiliasi dengan event/rute. |
| hubs | `hubs` | `hub_code → code`, `display_name → name`. |
| route stops | `route_stops` | AWB dan hub code diubah menjadi FK internal; `route_stop_id → seed_route_stop_id`. |
| shipment events | `shipment_events` | AWB/hub/stop diubah menjadi FK; `event_id → seed_event_id`. |
| temperature profiles | `temperature_profiles` | `asset_type` menjadi primary key profil. |
| thermal assets | `thermal_assets` | `asset_code` tetap menjadi natural key. |
| assignments | `shipment_asset_assignments` | AWB dan asset code diubah menjadi FK; `assignment_id → seed_assignment_id`; `asset_type` divalidasi, tidak diduplikasi. |
| temperature readings | `temperature_readings` | Asset code diubah menjadi FK; `reading_id → seed_reading_id`; kolom `trigger` dipetakan ke `trigger_type`. |

Urutan impor:

```text
hubs
→ temperature_profiles
→ thermal_assets
→ shipments
→ route_stops
→ shipment_events
→ shipment_asset_assignments
→ temperature_readings
```

## Constraint utama dalam DDL

- AWB, kode hub, kode aset, dan ID seed unik.
- Hub, shipment, profil, aset, dan route stop dilindungi foreign key.
- Pasangan `event_code` dan `stage` divalidasi.
- Event hub wajib mempunyai `hub_id`.
- Event hanya dapat menunjuk stop dari shipment yang sama.
- Exclusion constraint PostgreSQL mencegah assignment satu AWB tumpang tindih.
- `source + message_id` mencegah retry Node-RED menggandakan reading.
- Reading `ON_DEMAND` wajib mempunyai `request_id`.
- Indeks disediakan untuk status terbaru, suhu terbaru, assignment aktif berdasarkan aset maupun shipment, dan anomali. Assignment aktif per shipment memakai unique partial index agar satu AWB tidak mempunyai lebih dari satu penugasan aktif.

## Aturan yang tetap dijaga Laravel

Constraint database tidak menggantikan seluruh aturan proses. Laravel tetap menangani:

- pembuatan rute yang dimulai pickup dan berakhir delivery;
- validasi transisi event sesuai FRD;
- kewajiban minimal satu event per shipment;
- penutupan assignment ketika paket delivered;
- perhitungan `temperature_status` dari profil aktif;
- cooldown dan penggabungan permintaan Refresh per aset;
- larangan event baru setelah delivered;
- rekonsiliasi snapshot shipment dengan event/rute;
- pagination histori suhu.

## Catatan terhadap `db.md`

Model ERD pada `db.md` sudah sesuai dengan delapan dataset. Tautan dataset lengkap sebaiknya diarahkan kembali ke folder delapan CSV, bukan hanya `anteraja_frozen_dataset-Shipments.csv`. Kardinalitas yang menyatakan setiap shipment wajib mempunyai minimal satu event harus dijaga oleh transaksi import/service karena foreign key saja tidak dapat memaksa parent mempunyai child.
