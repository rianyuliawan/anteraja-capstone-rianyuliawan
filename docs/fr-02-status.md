# FR-02 — Ringkasan dan linimasa

**Acuan:** [FRD global](../frd.md) · **Prioritas:** P0

**Tujuan:** menunjukkan paket mana yang ditemukan dan tahap perjalanan yang benar-benar diketahui.

**Input:** respons tracking berisi `awb`, `pickup_area`, `pickup_point`, `delivery_area`, `delivery_point`, `current_stage`, `last_stage_at`, dan `stage_timeline[]` (`stage`, `event_code`, `occurred_at`, `hub_name?`, `media[]?`). Media publik hanya membawa `media_type`, URL bertanda tangan yang berumur pendek, `captured_at`, dan `alt_text`. `current_stage` dari event terbaru menurut waktu dan ID; bukan dari suhu.

**Tampilan:** ringkasan AWB, nama kawasan pickup dan delivery, status terakhir, waktu WIB; linimasa hanya event yang ada, misalnya “Pickup 09.00”, “Tiba di Hub A 10.15”, “Keluar dari Hub A 11.05”, “Tiba di Hub B 12.20”. Beberapa event hub boleh tampil bila berbeda waktu/lokasi. Bila hanya snapshot, tampilkan status terakhir dan keterangan bahwa riwayat sebelumnya tidak tersedia. Tahap yang dilewati tidak diberi waktu buatan.

**Dokumentasi foto:** foto hanya boleh terkait dengan event `PICKED_UP` (`PICKUP_PHOTO`) atau `DELIVERED` (`DELIVERY_PHOTO`). Paket aktif boleh menampilkan foto pickup dan placeholder bahwa foto penerimaan belum tersedia. Foto delivery baru tampil setelah event `DELIVERED` sah. UI tidak menampilkan storage key, URL permanen, EXIF/GPS, wajah, label alamat, atau identitas perangkat. Foto berstatus `PENDING`/`REJECTED` tidak boleh dikirim oleh API publik; `APPROVED`/`REDACTED` boleh tampil melalui URL bertanda tangan yang berumur pendek.

**Validasi seed:** timestamp harus valid dan urutan kejadian harus masuk akal; `AT_HUB → IN_TRANSIT → AT_HUB` sah untuk dua hub berbeda. Event setelah `DELIVERED` ditolak. Event dengan waktu sama memakai ID sebagai pengurut stabil. `event_code` membedakan tiba/keluar hub dari label status umum.

**Penerimaan:** paket dengan dua kejadian hanya menampilkan dua kejadian; rute multi-hub menampilkan jam pickup dan tiap perpindahan yang tersedia; paket delivered dan paket aktif memiliki status berbeda sesuai sumber; suhu baru tidak mengubah status/linimasa; foto pickup/delivery hanya muncul pada event yang cocok dan telah lolos pemeriksaan privasi; paket belum delivered tidak menampilkan foto penerimaan.
