# Media Dokumentasi Pengiriman

Folder ini memuat 84 file WebP ilustratif yang dipasangkan dengan metadata pada `../shipment_event_media.csv`: satu foto untuk masing-masing 70 event pickup dan satu untuk masing-masing 14 event delivered. Struktur folder setelah `shipment-events/` mengikuti nilai `storage_key`, sehingga file dapat disalin ke private storage Laravel tanpa mengubah referensi database. Event yang belum delivered tidak memiliki foto penerimaan.

Semua gambar berukuran 1280×720 piksel, menggunakan format WebP, dan telah dibersihkan dari metadata EXIF. Gambar tidak memuat wajah, alamat pribadi, nomor resi, atau identitas penerima. Sebagian besar file memakai ulang foto stok yang sama. Karena itu, gambar hanya **ilustrasi untuk latihan relasi data dan UI**, bukan bukti bahwa tiap paket benar-benar difoto. Saat dipakai secara operasional, setiap file harus diganti bukti unik yang lolos pemeriksaan privasi.

## Pemetaan dan sumber

| Media ID | File | Penggunaan | Sumber |
|---|---|---|---|
| `MED-00001` | `shipment-events/ANT-FRZ-0002/pickup.webp` | Ilustrasi pickup asli dalam dataset | [Brown Boxes at the Doorway — Tima Miroshnichenko, Pexels](https://www.pexels.com/photo/brown-boxes-at-the-doorway-6169001/) |
| `MED-00002` | `shipment-events/ANT-FRZ-0012/pickup.webp` | Ilustrasi pickup alternatif | [Brown Cardboard Box Beside White Wooden Door — Tima Miroshnichenko, Pexels](https://www.pexels.com/photo/brown-cardboard-box-beside-white-wooden-door-6170455/) |
| `MED-00003` | `shipment-events/ANT-FRZ-0012/delivery.webp` | Ilustrasi delivery asli dalam dataset | [A Brown Cardboard Box Beside White Door — Tima Miroshnichenko, Pexels](https://www.pexels.com/photo/a-brown-cardboard-box-beside-white-door-6170463/) |
| `MED-00004`–`MED-00084` | Berkas per AWB dalam `shipment-events/` | Salinan ilustrasi pickup/delivery, bukan foto unik tiap paket | Sumber pickup `MED-00001` dan delivery `MED-00003` di atas |

Foto tersedia untuk digunakan berdasarkan [Pexels License](https://www.pexels.com/license/). Atribusi tetap disimpan di repositori agar asal aset dapat diaudit.

## Pemeriksaan integritas

Ukuran file, dimensi, dan checksum SHA-256 yang sebenarnya sudah dicatat pada `shipment_event_media.csv`. Untuk memeriksa ulang checksum dari root repositori:

```bash
sha256sum src/anteraja-frozen-app/backend/database/dataset/media/shipment-events/*/*.webp
```
