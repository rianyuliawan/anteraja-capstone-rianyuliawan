# FR-03 — Peta rute ilustratif

**Acuan:** [FRD global](../frd.md) · **Prioritas:** P0

**Tujuan:** memperlihatkan urutan hub yang direncanakan dan batas perjalanan yang telah tercatat.

**Input:** `route_stops[]` berurutan (`stop_order`, `point_type=PICKUP|HUB|DELIVERY`, `hub_code?`, `name`, `latitude`, `longitude`) serta `completed_stop_order?` dari event/progres terakhir yang sah. Marker pickup/delivery menampilkan nama kawasan dan koordinat penanda area, bukan alamat persis atau GPS paket; titik hub merujuk tabel hub. Tidak membaca posisi dari suhu.

**Aturan:** pickup, hub, dan delivery digambar sebagai marker dengan label berbeda. Segmen dari stop sebelumnya sampai stop dengan `stop_order <= completed_stop_order` pink; segmen setelah itu abu-abu. Jika progres tidak diketahui, seluruh garis netral dan label “progres lokasi belum tersedia”. Jika rute kurang dari dua titik/tile gagal, tampilkan daftar teks titik singgah dan tetap tampilkan status. Koordinat dan garis adalah ilustrasi, bukan GPS atau jalur jalan. Popup informasi hub lanjutan adalah P1.

**Penerimaan:** rute tiga hub dengan progres di hub kedua memberi satu segmen pink dan satu abu-abu; tanpa progres tidak ada segmen pink; peta gagal dimuat tidak menghilangkan ringkasan paket.
