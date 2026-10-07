# Big Data Bottleneck Analysis — Anteraja

Analisis ini menggunakan PySpark untuk menghitung dwell time setiap kombinasi `package_id × hub_id`, mengevaluasi kualitas pasangan scan `ARRIVAL → DEPARTURE`, dan menentukan hub yang perlu diprioritaskan untuk investigasi operasional.

## 1. Big Data: 5 Vs dan Keterbatasan Pandas

- **Volume**: log scan dapat tumbuh menjadi jutaan atau miliaran event sehingga tidak selalu muat di RAM satu komputer.
- **Velocity**: event ARRIVAL dan DEPARTURE terus masuk dan perlu diproses tepat waktu.
- **Variety**: data dapat berasal dari scanner, aplikasi kurir, API, dan sistem hub dengan format berbeda.
- **Veracity**: missing scan, duplicate event, timestamp rusak, dan urutan event yang salah dapat menghasilkan insight keliru.
- **Value**: log scan bernilai ketika dapat menunjukkan bottleneck dan mengarahkan tindakan operasional.

Pandas memproses data pada satu mesin sehingga dibatasi RAM dan CPU mesin tersebut. PySpark membagi data serta komputasi ke beberapa partition/worker dan lebih sesuai untuk operasi filter, group, aggregate, dan sort pada data besar. Dalam analisis ini Pandas hanya digunakan melalui `toPandas()` untuk mengekspor hasil akhir yang ukurannya kecil.

## 2. Dataset dan Schema

Dataset `scan_events` merupakan simulasi deterministik dengan seed `42` dan tepat 2.500 kombinasi paket–hub. Simulasi sengaja memuat missing scan, duplicate event, timestamp tidak valid, dan DEPARTURE sebelum ARRIVAL untuk menguji proses validasi.

Schema mentah:

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `package_id` | STRING | ID unik paket |
| `hub_id` | STRING | ID hub operasional |
| `event_type` | STRING | ARRIVAL atau DEPARTURE |
| `timestamp` | STRING | Timestamp ISO-8601 mentah |

Setelah parsing, kolom tambahan `ts` bertipe `TIMESTAMP`. Timestamp yang tidak dapat diparsing menjadi `NULL` melalui `try_to_timestamp`, sehingga proses validasi tidak menghentikan notebook.

Jumlah event mentah: **4.865 event**.

## 3. Data Quality Check

Pemeriksaan dilakukan pada tingkat `package_id × hub_id` sebelum menghitung dwell time.

| Pemeriksaan | Hasil |
| --- | ---: |
| Null pada kolom mentah | 0 |
| Missing ARRIVAL | 44 |
| Missing DEPARTURE | 201 |
| Timestamp tidak valid | 25 |
| Duplicate persis | 32 |
| Kelompok event dengan scan ganda | 109 |
| Total kelebihan duplicate scan | 110 |
| DEPARTURE sebelum/sama dengan ARRIVAL | 18 |
| Pasangan valid | 2.236 |
| Coverage pasangan valid | 89,44% |

Duplicate persis dihapus terlebih dahulu. Selanjutnya hanya event ARRIVAL/DEPARTURE dengan timestamp valid yang digunakan, lalu scan pertama dipilih untuk setiap kombinasi `package_id × hub_id × event_type`. Pasangan dengan `departure_ts <= arrival_ts` dikeluarkan dari perhitungan dwell time.

## 4. Query/Kode PySpark

### Parsing timestamp secara aman

```python
df_parsed = df_raw.withColumn(
    "ts",
    F.try_to_timestamp("timestamp")
)
```

### Memilih scan pertama dan membentuk pasangan

```python
window = (
    Window.partitionBy("package_id", "hub_id", "event_type")
    .orderBy(F.col("ts").asc())
)

first_events = (
    df_usable
    .withColumn("row_number", F.row_number().over(window))
    .filter(F.col("row_number") == 1)
)

complete_pairs = arrivals.join(
    departures,
    ["package_id", "hub_id"],
    "inner"
)
```

### Menghitung dwell time

```python
valid_dwell = (
    complete_pairs
    .filter(F.col("departure_ts") > F.col("arrival_ts"))
    .withColumn(
        "dwell_hours",
        (
            F.col("departure_ts").cast("long")
            - F.col("arrival_ts").cast("long")
        ) / 3600.0
    )
)
```

### Aggregate dan sort per hub

```python
hub_dwell_summary = (
    valid_dwell.groupBy("hub_id")
    .agg(
        F.count("*").alias("package_count"),
        F.round(F.avg("dwell_hours"), 2).alias("avg_dwell_hours"),
        F.round(
            F.percentile_approx("dwell_hours", 0.5, 10_000), 2
        ).alias("median_dwell_hours")
    )
    .orderBy(F.desc("avg_dwell_hours"))
)
```

## 5. Hasil Perhitungan Dwell Time

Sebanyak **2.236 pasangan valid** digunakan untuk analisis. Dwell time dihitung dalam jam dari selisih timestamp DEPARTURE dan ARRIVAL.

Top 5 berdasarkan average dwell time:

| Rank | Hub | Paket valid | Avg (jam) | Median (jam) | P95 (jam) | Valid-pair rate |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | HUB_MKS | 539 | 10,53 | 10,61 | 14,39 | 88,22% |
| 2 | HUB_YGY | 83 | 9,49 | 9,44 | 13,90 | 84,69% |
| 3 | HUB_SBY | 339 | 8,41 | 8,64 | 12,24 | 89,45% |
| 4 | HUB_BDG | 223 | 7,51 | 7,63 | 11,96 | 90,28% |
| 5 | HUB_JKT | 805 | 6,93 | 6,91 | 11,07 | 91,58% |

## 6. Kualitas Pasangan Top Bottleneck

| Hub | Missing ARRIVAL | Missing DEPARTURE | Duplicate ekstra | Timestamp invalid | Invalid order |
| --- | ---: | ---: | ---: | ---: | ---: |
| HUB_MKS | 13 | 52 | 18 | 4 | 6 |
| HUB_YGY | 4 | 10 | 4 | 2 | 1 |
| HUB_SBY | 8 | 30 | 20 | 5 | 2 |
| HUB_BDG | 3 | 19 | 14 | 4 | 2 |
| HUB_JKT | 10 | 59 | 44 | 10 | 5 |

HUB_MKS layak menjadi prioritas karena average dan median dwell time-nya sama-sama tertinggi serta didukung 539 paket valid. HUB_YGY berada di posisi kedua, tetapi memiliki sampel lebih kecil dan valid-pair rate lebih rendah. Kualitas scan tetap harus diperbaiki agar ranking berikutnya semakin andal.

## 7. Business Insight dan Rekomendasi

**HUB_MKS merupakan prioritas investigasi karena memiliki average dwell time tertinggi sebesar 10,53 jam, median 10,61 jam, dan p95 14,39 jam pada 539 paket valid. Kualitas pasangannya memiliki valid-pair rate 88,22%, dengan 13 missing ARRIVAL, 52 missing DEPARTURE, 18 duplicate extra scan, 4 timestamp tidak valid, serta 6 pasangan DEPARTURE sebelum ARRIVAL. Tim operasional sebaiknya memeriksa kapasitas sorting, antrean paket, jadwal keberangkatan line-haul, dan disiplin pemindaian di HUB_MKS, kemudian memecah analisis per jam atau shift untuk menemukan periode penyebab dwell time tertinggi.**

## 8. Output

- `output/top_bottleneck_hubs.csv`: lima hub dengan average dwell tertinggi.
- `output/hub_dwell_summary.csv`: hasil agregasi seluruh hub.
- `output/scan_pairs_dwell.csv`: pasangan scan valid dan dwell time per paket–hub.
- `output/data_quality_summary.csv`: ringkasan pemeriksaan kualitas global.
- `output/hub_quality_summary.csv`: kualitas pasangan scan per hub.

Seluruh output dihasilkan dari satu eksekusi notebook `analysis/bottleneck_analysis.ipynb` dan ditulis tanpa kolom indeks tambahan.
