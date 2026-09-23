# Media Dokumentasi Pengiriman

Folder ini memuat tiga foto contoh yang dipasangkan dengan metadata pada `../shipment_event_media.csv`. Struktur folder setelah `shipment-events/` mengikuti nilai `storage_key`, sehingga file dapat disalin ke private storage Laravel tanpa mengubah referensi database.

Semua gambar berukuran 1280×720 piksel, menggunakan format WebP, dan telah dibersihkan dari metadata EXIF. Gambar tidak memuat wajah, alamat pribadi, nomor resi, atau identitas penerima. Gambar ini hanya digunakan sebagai data latihan dan perlu diganti dengan bukti operasional yang telah lolos pemeriksaan privasi saat sistem dipakai di lingkungan nyata.

## Pemetaan dan sumber

| Media ID | File | Penggunaan | Sumber |
|---|---|---|---|
| `MED-00001` | `shipment-events/ANT-FRZ-0002/pickup.webp` | Bukti pickup paket `ANT-FRZ-0002` | [Brown Boxes at the Doorway — Tima Miroshnichenko, Pexels](https://www.pexels.com/photo/brown-boxes-at-the-doorway-6169001/) |
| `MED-00002` | `shipment-events/ANT-FRZ-0012/pickup.webp` | Bukti pickup paket `ANT-FRZ-0012` | [Brown Cardboard Box Beside White Wooden Door — Tima Miroshnichenko, Pexels](https://www.pexels.com/photo/brown-cardboard-box-beside-white-wooden-door-6170455/) |
| `MED-00003` | `shipment-events/ANT-FRZ-0012/delivery.webp` | Bukti penerimaan paket `ANT-FRZ-0012` | [A Brown Cardboard Box Beside White Door — Tima Miroshnichenko, Pexels](https://www.pexels.com/photo/a-brown-cardboard-box-beside-white-door-6170463/) |

Foto tersedia untuk digunakan berdasarkan [Pexels License](https://www.pexels.com/license/). Atribusi tetap disimpan di repositori agar asal aset dapat diaudit.

## Pemeriksaan integritas

Ukuran file, dimensi, dan checksum SHA-256 yang sebenarnya sudah dicatat pada `shipment_event_media.csv`. Untuk memeriksa ulang checksum dari root repositori:

```bash
sha256sum docs/database/sample-data/media/shipment-events/*/*.webp
```
