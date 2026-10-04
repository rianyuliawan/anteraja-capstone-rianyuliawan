# Analisis SQL Pengiriman Anteraja Frozen

Query berikut dijalankan langsung di PostgreSQL lokal `anteraja_frozen_app` pada 5 Oktober 2026. Hasil yang ditulis adalah cuplikan saat pengujian; nilai suhu dapat berubah setelah simulasi Node-RED berikutnya. Ini adalah latihan SQL Day 14; API aplikasi tetap membaca data utama melalui model Eloquent. Dataset memuat 70 shipment dan 4 kurir. Skema proyek tidak menyimpan berat paket karena fitur tarif tidak termasuk FRD, sehingga contoh pengurutan dan pengelompokan berat diadaptasi menjadi analisis suhu.

## 1 Pengiriman dalam perjalanan diurutkan menurut suhu terbaru

`WHERE` memilih status perjalanan dan `ORDER BY` menempatkan suhu terbaru yang paling tinggi lebih dahulu. `LEFT JOIN` menjaga shipment tetap terlihat jika pembacaan suhunya belum ada.

```sql
SELECT s.awb, cs.current_stage, lt.asset_code, lt.temperature_c
FROM shipments s
JOIN shipment_current_status cs ON cs.shipment_id = s.id
LEFT JOIN shipment_latest_temperature lt ON lt.shipment_id = s.id
WHERE cs.current_stage = 'IN_TRANSIT'
ORDER BY lt.temperature_c DESC NULLS LAST, s.awb
LIMIT 10;
```

Hasil contoh: `ANT-FRZ-0017` dan `ANT-FRZ-0053` memakai `BOX-05` dengan suhu terakhir `-4,95 °C`; `ANT-FRZ-0002` memakai `BOX-02` dengan `-5,01 °C`. Query mengembalikan 10 baris.

## 2 Kategori suhu dengan CASE

`CASE` menerjemahkan status pembacaan terakhir setiap shipment menjadi kategori yang mudah dibaca tanpa menambah kolom kategori pada tabel.

```sql
SELECT s.awb, lt.temperature_c,
       CASE
           WHEN lt.temperature_status = 'CRITICAL' THEN 'Kritis'
           WHEN lt.temperature_status = 'WARNING' THEN 'Perlu perhatian'
           WHEN lt.temperature_status = 'NORMAL' THEN 'Normal'
           ELSE 'Belum ada pembacaan'
       END AS kategori_suhu
FROM shipments s
LEFT JOIN shipment_latest_temperature lt ON lt.shipment_id = s.id
ORDER BY s.awb
LIMIT 10;
```

Hasil contoh: `ANT-FRZ-0001` = `-4,94 °C` (`Normal`), `ANT-FRZ-0002` = `-5,01 °C` (`Normal`), dan `ANT-FRZ-0003` = `-4,82 °C` (`Normal`). Query mengembalikan 10 baris.

## 3 Jumlah shipment per kurir bulan ini

`COUNT(DISTINCT ...)` mencegah pickup dan delivery untuk resi yang sama terhitung dua kali. Filter bulan ditempatkan pada kondisi `LEFT JOIN` agar kurir dengan nol penugasan tetap tampil.

```sql
SELECT c.courier_code, c.display_name,
       COUNT(DISTINCT e.shipment_id) AS jumlah_shipment_bulan_ini
FROM couriers c
LEFT JOIN shipment_events e
  ON e.courier_id = c.id
 AND e.occurred_at >= date_trunc('month', CURRENT_TIMESTAMP)
 AND e.occurred_at < date_trunc('month', CURRENT_TIMESTAMP) + interval '1 month'
GROUP BY c.id, c.courier_code, c.display_name
ORDER BY jumlah_shipment_bulan_ini DESC, c.courier_code;
```

Hasil pada 5 Oktober 2026: `SAT-001`, `SAT-002`, `SAT-003`, dan `SAT-004` masing-masing `0`. Ini sesuai dataset: kejadian pengiriman contoh terjadi pada September 2026, bukan Oktober.

## 4 Rata rata suhu menurut status pengiriman

`GROUP BY` mengelompokkan status terbaru, sedangkan `AVG` menghitung suhu dari pembacaan yang benar-benar berada dalam periode penugasan aset ke shipment.

```sql
SELECT cs.current_stage,
       COUNT(DISTINCT h.shipment_id) AS shipment_terbaca,
       ROUND(AVG(h.temperature_c), 2) AS rata_rata_c
FROM shipment_current_status cs
LEFT JOIN shipment_temperature_history h ON h.shipment_id = cs.shipment_id
GROUP BY cs.current_stage
ORDER BY cs.current_stage;
```

| Status | Shipment terbaca | Rata rata °C |
| --- | ---: | ---: |
| AT_HUB | 14 | -3,73 |
| DELIVERED | 14 | -4,25 |
| IN_TRANSIT | 14 | -4,60 |
| OUT_FOR_DELIVERY | 14 | -4,42 |
| PICKED_UP | 14 | -4,87 |

Angka rata-rata adalah cuplikan saat query dijalankan dan dapat berubah ketika Node-RED menambah pembacaan yang masih masuk periode penugasan.

## 5 Kurir dengan lebih dari lima shipment

`HAVING` menyaring hasil setelah pengelompokan; `COUNT(DISTINCT ...)` menghitung resi unik per kurir, bukan jumlah seluruh event.

```sql
SELECT c.courier_code, c.display_name,
       COUNT(DISTINCT e.shipment_id) AS jumlah_shipment
FROM couriers c
JOIN shipment_events e ON e.courier_id = c.id
GROUP BY c.id, c.courier_code, c.display_name
HAVING COUNT(DISTINCT e.shipment_id) > 5
ORDER BY jumlah_shipment DESC, c.courier_code;
```

| Kurir | Jumlah shipment |
| --- | ---: |
| SAT-001 | 26 |
| SAT-003 | 26 |
| SAT-002 | 23 |
| SAT-004 | 23 |

## 6 Seluruh kurir termasuk yang belum menangani shipment

`LEFT JOIN` dimulai dari tabel kurir, sehingga kurir tanpa event tetap muncul dengan hitungan nol jika nanti ada kurir baru.

```sql
SELECT c.courier_code, c.display_name,
       COUNT(DISTINCT e.shipment_id) AS jumlah_shipment
FROM couriers c
LEFT JOIN shipment_events e ON e.courier_id = c.id
GROUP BY c.id, c.courier_code, c.display_name
ORDER BY jumlah_shipment, c.courier_code;
```

Hasil saat ini: `SAT-002` dan `SAT-004` masing-masing `23` shipment; `SAT-001` dan `SAT-003` masing-masing `26`. Semua kurir contoh sudah memiliki penugasan, tetapi query tetap menangani kurir baru yang belum mendapat paket.

## Kaitan dengan aplikasi

Query di atas dipakai untuk memahami relasi dan agregasi PostgreSQL, bukan menggantikan Eloquent pada API pelacakan. Redis menyimpan hasil baca pencarian, detail, dan riwayat suhu sementara; data sumber tetap berada di PostgreSQL. Cache detail dan riwayat resi yang terdampak dihapus setelah pembacaan Node-RED baru tersimpan.

Server-side processing pada aplikasi terjadi saat Laravel membatasi pencarian maksimal 10 AWB, memilih resi yang valid, dan meminta PostgreSQL menghitung status serta analisis suhu. React hanya merender respons yang sudah diproses server; latihan ini tidak menambah pagination pada riwayat suhu.
