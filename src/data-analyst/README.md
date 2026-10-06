# Shipment Delivery Analysis

Analisis data pengiriman Anteraja menggunakan Python untuk mengukur keterlambatan, membandingkan performa kurir, mengevaluasi pengaruh jarak dan berat paket, serta membangun model prediksi `delay_hours`.

## Struktur File

```text
data-analyst/
├── README.md
├── shipment-delivery-analysis.ipynb
└── shipments.csv
```

- `shipment-delivery-analysis.ipynb`: notebook utama yang berisi proses cleaning, analisis, visualisasi, modeling, dan insight bisnis.
- `shipments.csv`: dataset pengiriman yang digunakan oleh notebook.
- `README.md`: dokumentasi singkat analisis dan cara menjalankannya.

## Kolom Dataset

Dataset berisi 220 data pengiriman dengan kolom berikut:

| Kolom | Keterangan |
| --- | --- |
| `tracking_number` | Nomor identifikasi pengiriman |
| `courier` | Nama kurir |
| `weight_kg` | Berat paket dalam kilogram |
| `distance_km` | Jarak pengiriman dalam kilometer |
| `promised_hours` | Estimasi waktu pengiriman dalam jam |
| `actual_hours` | Waktu pengiriman aktual dalam jam |
| `delay_hours` | Selisih waktu aktual dan estimasi, dengan batas minimum 0 |

## Teknologi

- Python 3.12
- Pandas
- NumPy
- Matplotlib
- Scikit-Learn
- Jupyter Notebook

## Cara Menjalankan

Masuk ke folder analisis:

```bash
cd src/data-analyst
```

Buat dan aktifkan virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Pasang dependensi:

```bash
python -m pip install pandas numpy matplotlib scikit-learn ipykernel
```

Buka `shipment-delivery-analysis.ipynb` menggunakan VS Code atau Jupyter Notebook, pilih kernel `.venv`, lalu jalankan **Run All**. File `shipments.csv` harus berada dalam folder yang sama dengan notebook.

## Tahapan Analisis

1. Memuat dataset menggunakan Pandas.
2. Memeriksa ukuran data, tipe data, missing value, dan data duplikat.
3. Mengonversi kolom numerik serta membersihkan missing value dan duplikat.
4. Menghitung `delay_hours` dan memastikan nilainya tidak negatif.
5. Menghitung minimum, median, mean, dan standar deviasi menggunakan NumPy.
6. Membandingkan rata-rata delay per kurir menggunakan loop manual dan `groupby()`.
7. Membuat grafik batang dan menyorot kurir dengan rata-rata delay tertinggi.
8. Mengukur korelasi jarak dan berat paket terhadap keterlambatan.
9. Melatih Linear Regression dengan pembagian data latih dan data uji 80:20.
10. Membandingkan tingkat keterlambatan pengiriman jarak jauh dan jarak dekat.

## Hasil Utama

- Setelah cleaning terdapat 220 baris tanpa missing value dan tanpa duplikat.
- Minimum delay: **0,00 jam**.
- Median delay: **3,05 jam**.
- Rata-rata delay: **4,14 jam**.
- Standar deviasi delay: **3,80 jam**.
- Kurir dengan rata-rata delay tertinggi adalah **Citra**, yaitu **7,90 jam**.
- Korelasi jarak terhadap delay adalah **0,710**, lebih kuat dibandingkan korelasi berat terhadap delay sebesar **0,220**.
- Model Linear Regression memperoleh **R² test 0,525** dan **RMSE test 2,449 jam**.
- Seluruh 24 pengiriman di atas 50 km mengalami delay lebih dari 2 jam, sedangkan pada pengiriman di bawah 10 km angkanya sebesar 9,3% dari 54 pengiriman.

## Insight Bisnis

Pengiriman di atas 50 km mengalami keterlambatan lebih dari 2 jam sebesar 100%, sekitar 10,8 kali lebih sering dibandingkan pengiriman di bawah 10 km yang hanya 9,3%, sehingga kapasitas dan perencanaan rute jarak jauh perlu diprioritaskan.

## Validasi

Notebook telah dijalankan dari awal sampai akhir menggunakan kernel proyek. Seluruh cell berhasil dieksekusi tanpa error dan output analisis serta visualisasi telah tersimpan di dalam notebook.
