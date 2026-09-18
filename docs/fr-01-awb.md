# FR-01 — Cari AWB

**Acuan:**  **Pengguna:** pengunjung tanpa login · **Prioritas:** P0

**Tujuan:** pengguna dapat membuka detail satu paket melalui input AWB teks.

**Alur:** ketik/tempel AWB → tekan Cari/Enter → FE trim spasi tepi dan mencegah input kosong → `GET /api/track/{awb}` → tampilkan hasil atau kesalahan. Backend menerapkan format AWB seed yang disetujui, normalisasi huruf bila format mengizinkan, pencocokan persis, dan rate limit.

**Keadaan:** kosong (petunjuk contoh format), memuat, ditemukan, `404` tidak ditemukan, `422` format salah, `429` terlalu sering, `5xx`/jaringan gagal. Pada kesalahan, hasil AWB sebelumnya tidak boleh disalahartikan sebagai hasil input baru. Tidak ada kamera atau daftar AWB publik.

**Penerimaan:** AWB benar mengembalikan tepat satu paket; AWB salah tidak membocorkan paket lain; Enter dan tombol bekerja di ponsel/desktop; input kosong tidak mengirim request; rate limit dan validasi backend teruji.
