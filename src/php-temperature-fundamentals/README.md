# Analisis suhu dengan PHP dasar

Bagian **Rian Y. — Frozen Temperature Traceability System** dalam modul PHP membahas analisis riwayat suhu. Saya membuat latihan terpisah untuk merangkum pembacaan suhu satu aset termal dan mengenali bacaan yang lebih hangat daripada batas contoh. Data pada latihan ini adalah simulasi; belum berasal dari sensor atau database dan bukan pernyataan kondisi pengiriman nyata.

## Yang dibuat

| Berkas | Isi |
| --- | --- |
| `index.php` | Halaman web untuk mengisi batas suhu dan daftar pembacaan, lalu melihat hasil analisis. Formulir diproses oleh PHP di server tanpa JavaScript. |
| `styles.css` | Tampilan responsif halaman latihan dengan warna yang mengikuti proyek Anteraja Frozen. |
| `temperature-functions.php` | Fungsi analisis yang dipakai oleh halaman web dan skrip terminal. |
| `analisis-suhu.php` | Contoh hasil analisis dalam bentuk teks menggunakan data yang sama. |
| `tests/analisis-suhu-test.php` | Pengujian hasil, batas tepat, dua pelanggaran beruntun, dan data kosong. |

## Alur data dan fungsi

1. `index.php` menerima daftar suhu dan batas atas contoh dari formulir. Nilai diperiksa sebelum dikirim ke fungsi analisis; masukan yang tidak valid menghasilkan pesan kesalahan tanpa menjalankan perhitungan.
2. `analisisSuhu(array $daftarSuhu, float $batasAtasC): array` memakai `foreach` dan `if` untuk menghitung bacaan di atas batas. Fungsi bawaan `max()`, `min()`, `array_sum()`, dan `count()` menghasilkan suhu tertinggi, terendah, dan rata-rata. Hasil dikembalikan sebagai array asosiatif.
3. `rentetanPelanggaranTerpanjang()` adalah fungsi **rekursif**. Setiap pemanggilan memeriksa satu bacaan lalu memanggil dirinya untuk bacaan berikutnya. Ketika indeks mencapai jumlah bacaan, fungsi berhenti dan mengembalikan panjang rentetan terpanjang. Jika rentetan mencapai dua, halaman menampilkan alarm contoh.
4. Halaman web memakai hasil fungsi yang sama untuk menampilkan ringkasan dan tabel setiap pembacaan. Dengan demikian, tampilan tidak memiliki rumus suhu tersendiri.

Contoh `-15,8 > -18` berarti bacaan tersebut lebih hangat daripada batas atas contoh dan dihitung sebagai pelanggaran. Bacaan tepat di batas tidak dihitung sebagai pelanggaran. Rentetan dua bacaan di luar batas belum menunjukkan berapa lama suhu berada di luar batas karena waktu tiap bacaan tidak dihitung.

## Hubungan dengan proyek utama

Latihan ini memakai satu aset contoh, `REEFER-BOX-01`, dan batas `-18 °C` dari modul. Batas tersebut bukan konfigurasi untuk setiap aset nyata. Pada rancangan database proyek utama, pembacaan suhu melekat pada **aset termal**; hubungan ke AWB ditentukan melalui periode penugasan aset ke pengiriman. Latihan ini belum menulis ke tabel tersebut dan tidak mengubah frontend React, Laravel, atau alur Node-RED yang sudah ada.

## Branch dan riwayat pekerjaan

Latihan ini dikerjakan terpisah pada branch `feature/php-temperature-analysis`. Perubahan dibagi menjadi tiga commit: (1) fungsi analisis dan pengujian, (2) halaman web responsif, dan (3) dokumentasi. Adaptasi ini menerapkan konsep PHP Fundamentals pada kasus pemantauan suhu proyek saya; **bukan** implementasi kalkulator tarif pengiriman.
