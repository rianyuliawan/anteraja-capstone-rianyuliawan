# FR-06 — Sumber dan ingest suhu Node-RED

**Acuan:** [FRD global](../frd.md) · **Prioritas:** P0 · **Aktor:** Node-RED dan backend Laravel

**Tujuan:** menyediakan pembacaan suhu lingkungan aset termal secara terjadwal **dan** atas permintaan Refresh. Pada tahap ini Node-RED belum tersambung ke perangkat fisik.

**Dua pemicu, satu generator:** (1) Node-RED `Inject` tiap ±30 menit untuk aset yang aktif; (2) endpoint internal Node-RED yang hanya dapat dipanggil backend saat pengguna meminta Refresh. Keduanya memakai fungsi pembangkit yang sama dan mengirim hasil lewat `POST /api/internal/temperature-readings`. Node-RED tidak menulis DB langsung. Jadwal tidak harus tepat sampai detik; pembacaan yang terlewat tidak diisi dengan angka rekaan.

**Payload minimum ke ingest:** `{ "message_id": "uuid-unik", "request_id": "uuid-atau-null", "asset_code": "BOX-01", "observed_at": "2026-09-18T03:00:00Z", "temperature_c": -3.4, "source": "NODE_RED", "trigger": "ON_DEMAND" }`; `trigger` dapat `SCHEDULED` atau `ON_DEMAND`. `message_id` tetap sama saat retry. Server mengisi `received_at`, mengambil `asset_type` dari DB, memvalidasi waktu/nilai, menghitung label hanya jika profil ambang jenis aset sudah ditetapkan, dan menyimpan satu kali.

**Profil suhu:** `HUB_FREEZER` normal pada −5 s.d. −2 °C sesuai [publikasi Anteraja](https://blog.anteraja.id/anteraja-frozen/); `COOLER_BAG` dan `MOBIL_BOX` normal pada −8 s.d. −2 °C sebagai parameter rancangan. Batas `WARNING` mengikuti `temperature_profiles.csv`; nilai di luar batas itu `CRITICAL`. Publikasi tersebut tidak menetapkan suhu atau keberadaan mobil boks Anteraja. Suhu produk tertentu saat diserahkan di bawah −18 °C bukan suhu lingkungan aset.

**Keamanan dan idempotensi:** endpoint pemicu Node-RED hanya di jaringan internal dan membutuhkan kredensial antarlayanan; endpoint ingest Laravel membutuhkan token mesin. Aset tidak dikenal, nilai di luar rentang masuk akal, waktu tidak valid, dan payload salah ditolak. Unik (`source`, `message_id`) mencegah duplikat; `request_id` mengaitkan respons on-demand ke klik yang benar. Backend membatasi frekuensi per aset dan tidak menerima suhu yang ditentukan browser. Node-RED tidak berhak mengubah status, event, atau rute.

**Penerimaan:** jadwal menghasilkan pembacaan tiap ±30 menit ketika flow aktif; Refresh menghasilkan pembacaan baru tanpa menunggu jadwal; keduanya terlihat pada AWB yang penugasan asetnya berlaku; retry tidak menggandakan; kegagalan pembacaan tidak memajukan jam “Terakhir diperbarui”; nilai/label tidak diklaim sebagai suhu produk atau standar resmi.
