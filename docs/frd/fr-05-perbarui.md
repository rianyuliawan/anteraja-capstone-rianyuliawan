# FR-05 — Refresh suhu saat itu

**Acuan:** [FRD global](../frd.md) · **Prioritas:** P0

**Tujuan:** pengguna paket aktif dapat meminta pembacaan suhu **sekarang**, bukan hanya mengambil nilai dari jadwal 30 menit terakhir.

**Alur:** pada paket aktif, tombol Refresh → FE `POST /api/track/{awb}/refresh-temperature` → Laravel cari AWB dan penugasan aset aktif pada waktu request → Laravel panggil endpoint internal Node-RED dengan `asset_code` dan `request_id` → Node-RED buat pembacaan saat itu dan kirim melalui ingest bertoken → setelah penyimpanan dikonfirmasi, backend mengambil `GET /api/track/{awb}` terbaru → UI menampilkan suhu/waktu baru. Browser tidak boleh menghubungi Node-RED langsung atau menentukan nilai suhu sendiri.

**Paket delivered:** tombol hanya melakukan `GET /api/track/{awb}` untuk riwayat terakhir, tanpa pembacaan baru setelah pengiriman selesai. Bila paket aktif tetapi belum memiliki aset aktif, tombol hanya menampilkan keterangan “aset suhu belum tersedia”; tidak membuat pembacaan untuk AWB.

**Kegagalan/pengaman:** saat menunggu, tampilkan “Mengambil suhu terbaru…”. Jika Node-RED gagal/timeout, pertahankan suhu terakhir **dengan pesan gagal**, jangan mengganti label waktu menjadi waktu klik. Terapkan rate limit/cooldown singkat per AWB dan aset, serta kunci/penggabungan permintaan serentak agar banyak AWB dalam mobil boks yang sama tidak memicu pembacaan ganda. Klik ulang sangat cepat boleh mengembalikan pembacaan terkini yang sama dan menjelaskan jeda. Refresh tidak mengubah event, status, rute, atau lokasi.

**Penerimaan:** satu klik yang diizinkan pada paket aktif menghasilkan satu pembacaan baru dengan `observed_at` saat request (dalam toleransi proses), lalu kartu suhu dan riwayat berubah; klik pada delivered tidak membuat baris baru; aset tanpa penugasan, timeout, dan klik serentak tidak menghasilkan nilai palsu/duplikat.
