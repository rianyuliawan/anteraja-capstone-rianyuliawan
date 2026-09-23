# FR-04 — Suhu terbaru dan riwayat

**Acuan:** [FRD global](../frd.md) · **Prioritas:** P0

**Tujuan:** menampilkan pembacaan suhu lingkungan aset termal yang dapat dikaitkan secara sah dengan AWB.

**Input:** `latest_temperature` dan `temperature_history[]` berisi `temperature_c`, `temperature_status?`, `observed_at`, `asset_code`, `asset_type`, `source=SEED|NODE_RED`; riwayat maksimum 20 terbaru. Seed menyediakan riwayat awal, lalu Node-RED menambah pembacaan terjadwal atau atas Refresh. Backend memilih pembacaan via rentang penugasan aset, termasuk aset sebelumnya bila paket berpindah dari cooler bag ke freezer hub atau mobil boks.

**Tampilan:** pisahkan angka dan waktunya, misalnya “Suhu terakhir: −3,4 °C” dan “Terakhir diperbarui: 14.30 WIB, 18 September 2026”. Waktu berasal dari `observed_at`, bukan waktu tombol diklik. Sebut jenis aset tanpa menambahkan label sumber pada setiap pembacaan. Tampilkan label status hanya bila profil suhu untuk jenis aset tersebut tersedia. Untuk paket aktif, usia pembacaan >60 menit → “data belum diperbarui”. Untuk delivered → “pembacaan terakhir”; tanpa data → “belum ada data suhu”. Jangan menghubungkan titik-titik pembacaan menjadi klaim suhu kontinu, menampilkan 0 °C sebagai fallback, atau menyebut suhu inti makanan. Rujukan −5 s.d. −2 °C berlaku untuk freezer titik operasional menurut [Anteraja](https://blog.anteraja.id/anteraja-frozen/), bukan otomatis untuk mobil boks.

**Penerimaan:** pembacaan baru muncul setelah ingest dan refresh; pembacaan aset di luar masa assignment tidak muncul; aset bersama dapat memberikan pembacaan yang sama ke beberapa AWB yang penugasannya berlaku; data lama dan kosong mempunyai label yang tepat.
