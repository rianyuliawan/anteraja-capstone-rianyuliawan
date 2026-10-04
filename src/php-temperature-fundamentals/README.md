# Latihan PHP analisis suhu

Bagian **Rian Y. — Frozen Temperature Traceability System** dalam modul PHP membahas analisis riwayat suhu. Saya membuat latihan terpisah untuk merangkum pembacaan suhu satu aset termal dan mengenali bacaan yang lebih hangat daripada batas contoh. Day 11 memperkenalkan fungsi PHP dasar; Day 12 melanjutkannya dengan class, form `POST`, validasi server-side, dan session. Semua data pada latihan ini adalah simulasi, belum berasal dari sensor atau database.

## Day 11 — fungsi PHP dasar

| Berkas | Isi |
| --- | --- |
| `index.php` | Halaman Day 11 untuk mengisi batas suhu dan daftar pembacaan, lalu melihat hasil analisis. Formulir diproses oleh PHP di server tanpa JavaScript. |
| `styles.css` | Tampilan responsif halaman latihan dengan warna yang mengikuti proyek Anteraja Frozen. |
| `temperature-functions.php` | Fungsi analisis yang dipakai oleh halaman web dan skrip terminal. |
| `analisis-suhu.php` | Contoh hasil analisis dalam bentuk teks menggunakan data yang sama. |
| `tests/analisis-suhu-test.php` | Pengujian hasil, batas tepat, dua pelanggaran beruntun, dan data kosong. |

### Alur data dan fungsi

1. `index.php` menerima daftar suhu dan batas atas contoh dari formulir. Nilai diperiksa sebelum dikirim ke fungsi analisis; masukan yang tidak valid menghasilkan pesan kesalahan tanpa menjalankan perhitungan.
2. `analisisSuhu(array $daftarSuhu, float $batasAtasC): array` memakai `foreach` dan `if` untuk menghitung bacaan di atas batas. Fungsi bawaan `max()`, `min()`, `array_sum()`, dan `count()` menghasilkan suhu tertinggi, terendah, dan rata-rata. Hasil dikembalikan sebagai array asosiatif.
3. `rentetanPelanggaranTerpanjang()` adalah fungsi **rekursif**. Setiap pemanggilan memeriksa satu bacaan lalu memanggil dirinya untuk bacaan berikutnya. Ketika indeks mencapai jumlah bacaan, fungsi berhenti dan mengembalikan panjang rentetan terpanjang. Jika rentetan mencapai dua, halaman menampilkan alarm contoh.
4. Halaman web memakai hasil fungsi yang sama untuk menampilkan ringkasan dan tabel setiap pembacaan. Dengan demikian, tampilan tidak memiliki rumus suhu tersendiri.

Contoh `-15,8 > -18` berarti bacaan tersebut lebih hangat daripada batas atas contoh dan dihitung sebagai pelanggaran. Bacaan tepat di batas tidak dihitung sebagai pelanggaran. Rentetan dua bacaan di luar batas belum menunjukkan berapa lama suhu berada di luar batas karena waktu tiap bacaan tidak dihitung.

## Day 12 — OOP, form, dan session

| Berkas | Isi |
| --- | --- |
| `TemperatureAnalysisRequest.php` | Class dengan property kode aset, daftar pembacaan, dan batas atas; constructor memvalidasi data, sedangkan method `analyze()` memanggil fungsi analisis Day 11. |
| `temperature-form.php` | Form HTML yang mengirim data dengan `method="post"` dan menampilkan kesalahan input bila ada. |
| `submit-request.php` | Memeriksa metode dan token form, memvalidasi input, membuat objek, lalu menyimpan hasil yang valid ke session. |
| `session-helpers.php` | Membuka session, menyiapkan dan memeriksa token CSRF, serta menyediakan fungsi kecil untuk tampilan dan redirect. |
| `request-history.php` | Menampilkan semua permintaan pada session browser tersebut, hasil dan daftar pembacaannya, serta total pelanggaran dari seluruh permintaan. |
| `clear-history.php` | Menghapus hanya riwayat analisis melalui permintaan `POST`; membuka URL dengan `GET` tidak menghapus data. |
| `tests/temperature-request-test.php` | Memeriksa hasil method, data riwayat, dan beberapa input yang harus ditolak. |

Alurnya: pengguna mengisi `temperature-form.php` → `submit-request.php` menerima `$_POST` → nilai yang kosong, bukan angka, di luar rentang, atau lebih dari 100 bacaan ditolak → `new TemperatureAnalysisRequest(...)` memvalidasi lagi → `analyze()` menghitung hasil melalui fungsi Day 11 → array hasil masuk ke `$_SESSION['temperature_requests']` → pengguna diarahkan ke `request-history.php`. Redirect setelah `POST` mencegah refresh halaman mengirim ulang data. Jika validasi gagal, pesan dan input sebelumnya disimpan sementara di session agar form dapat ditampilkan kembali tanpa kehilangan isian.

Session menyimpan array data biasa, **bukan objek PHP** dan bukan baris database. Riwayat berlaku hanya untuk session browser yang sama; pengguna lain tidak melihatnya. Tombol hapus memakai `POST` dan token CSRF, lalu mengosongkan riwayat. Form dan riwayat tetap berupa halaman PHP server-rendered, tidak memakai JavaScript.

## Hubungan dengan proyek utama

Latihan ini memakai contoh awal aset `REEFER-BOX-01` dan batas `-18 °C` dari modul. Pengguna dapat mengganti kode aset untuk kebutuhan simulasi, tetapi form ini tidak memeriksa keberadaan aset di database. Batas contoh tersebut bukan konfigurasi untuk setiap aset nyata. Pada proyek utama, pembacaan suhu melekat pada **aset termal**; hubungan ke AWB ditentukan melalui periode penugasan aset ke pengiriman. Latihan ini tidak menulis ke PostgreSQL/Aiven dan tidak mengubah frontend React, Laravel, atau alur Node-RED.

## Branch dan riwayat pekerjaan

Day 11 berada di branch `feature/php-temperature-analysis` dengan tiga commit: fungsi dan pengujian, halaman web, lalu dokumentasi. Day 12 melanjutkannya pada branch `feature/php-temperature-oop-session`, juga dipisahkan menjadi commit class dan tes, alur form/session, lalu dokumentasi. Adaptasi ini menerapkan konsep PHP pada kasus pemantauan suhu proyek saya; **bukan** implementasi `ShipmentRequest` atau kalkulator tarif pengiriman yang disebut pada contoh tugas umum. Karena itu, kesesuaian terhadap rubrik yang mewajibkan nama class dan perhitungan ongkir secara harfiah perlu dikonfirmasi dengan pengajar.
