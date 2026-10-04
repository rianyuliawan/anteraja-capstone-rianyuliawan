# Anteraja Frozen — migrasi UI interaktif ke React

Setelah halaman pelacakan dibuat dengan HTML, CSS, dan JavaScript interaktif, antarmuka yang sama saya susun ulang menggunakan **React dan Vite**. Tujuannya adalah memindahkan pengelolaan tampilan dari manipulasi DOM langsung ke komponen yang menerima props dan berubah mengikuti state.

Fitur yang tersedia meliputi pencarian hingga 10 AWB, daftar hasil, detail perjalanan, suhu aset, peta ilustratif, serta foto pickup dan penerimaan. Data yang digunakan masih berupa mock data lokal. Tampilan berganti tanpa memuat ulang dokumen, tetapi belum menggunakan React Router: URL tetap sama saat pengguna berpindah antara beranda, hasil, dan detail.

## Apa yang berubah dari UI interaktif

| Sebelumnya: HTML/CSS/JavaScript | Sekarang: React |
| --- | --- |
| JavaScript memilih dan mengubah elemen DOM secara langsung. | JSX dirender ulang berdasarkan state komponen. |
| Data hasil pencarian disisipkan ke halaman secara imperatif. | `ShipmentResults` merender `ShipmentCard` dari data dengan `.map()`. |
| Nilai input dibaca dari elemen formulir. | Nilai input disimpan dalam `useState` sebagai controlled component. |
| Tampilan dan logika berada dalam halaman/script yang sama. | UI dipisah menjadi komponen kecil dengan props dan callback. |

Tahap pertama berfokus pada dasar React. Pada tahap lanjutan ini, beranda memanggil **dua API publik** untuk ilustrasi produk beku dan eksplorasi wilayah. Data paket dan bukti foto per AWB tetap berupa mock data lokal; tidak ada React Router atau backend pada proyek latihan ini. Peta titik singgah digambar secara ilustratif dengan SVG.

## Menjalankan

```bash
cd src/anteraja-react-basic
npm install
npm run dev
```

Buka URL lokal yang ditampilkan Vite. Contoh AWB: `ANT-FRZ-0002` (dalam perjalanan), `ANT-FRZ-0012` (terkirim), `ANT-FRZ-0006`, `ANT-FRZ-0009`, dan `ANT-FRZ-0014`. Hingga 10 AWB dapat dimasukkan, dipisahkan koma. Nomor yang tidak ditemukan tidak memperoleh kartu hasil; jumlah kecocokan tetap ditampilkan.

## Tree of Components

```text
main.jsx
└─ TrackingPage (parent: mock data + state)
   ├─ SiteHeader
   ├─ SearchHero
   │  └─ AwbSearchForm
   │     └─ Button
   ├─ ShipmentProvider                     [view = home; Context API]
   │  └─ HomeContent
   │     ├─ LocationExplorer → LocationField, LocationSummary
   │     └─ PackageGallery
   ├─ ShipmentResults                     [view = results]
   │  └─ ShipmentCard
   │     ├─ Panel
   │     ├─ StatusBadge
   │     └─ Button
   ├─ ShipmentDetail                      [view = detail]
   │  ├─ ShipmentSummary
   │  ├─ TemperatureCard
   │  ├─ JourneyPanel → RouteMap
   │  ├─ EvidenceGallery
   │  └─ TemperatureJourney
   ├─ Toast
   └─ SiteFooter
```

`ShipmentProvider` membungkus bagian beranda saja. Ketika pengguna membuka hasil atau detail resi, fitur eksplorasi tidak memanggil API publik yang tidak diperlukan untuk pelacakan.

## Dua API publik dan letak penggunaannya

| Sumber | Endpoint yang dipanggil | Penggunaan |
| --- | --- | --- |
| [Emsifa API Wilayah Indonesia](https://github.com/emsifa/api-wilayah-indonesia) | `/v2/provinces.json`, lalu `/v2/regencies/{provinceId}.json` | Opsi provinsi dan kabupaten/kota untuk asal dan tujuan pada `LocationExplorer` di beranda. |
| [Wikimedia Commons Action API](https://www.mediawiki.org/wiki/API:Cross-site_requests) | `https://commons.wikimedia.org/w/api.php` dengan `generator=categorymembers`, `Category:Frozen food`, dan `prop=imageinfo` | `PackageGallery` menampilkan tiga ilustrasi penanganan paket beku beserta kredit dan tautan halaman lisensinya. Parameter `origin=*` memungkinkan permintaan CORS tanpa login. |

Pilihan wilayah adalah **simulasi formulir**, bukan verifikasi cakupan layanan, tarif, atau alamat sebuah AWB. Foto Wikimedia adalah **ilustrasi** dan tidak dipakai sebagai bukti pickup/delivery. Bukti tersebut tetap berasal dari mock data paket. Persyaratan kredit tiap gambar dapat berbeda; pengguna dapat membuka tautan sumber dan lisensinya pada kartu gambar.

## Custom hooks dan alur asynchronous

```text
usePublicApi(url) ── fetch + AbortController ── data, isLoading, isError, retry
   ├─ useProvinces() / useRegencies(provinceId) ── Emsifa
   └─ usePackageImages() ── Wikimedia Commons
                    ↓
ShipmentProvider (createContext) ── useShipmentContext() ── komponen beranda
```

- `src/hooks/usePublicApi.js` menangani `fetch`, kode HTTP bukan 2xx, status loading/error, tombol coba lagi, dan `AbortController`. Efek hanya berjalan saat URL atau jumlah percobaan berubah; cleanup membatalkan request lama ketika komponen dilepas atau provinsi berubah. Dengan begitu respons lama tidak menimpa pilihan baru.
- `src/hooks/useLocationData.js` menyediakan `useProvinces()` dan `useRegencies(provinceId)`. Daftar provinsi diminta **sekali** oleh provider; daftar kabupaten/kota diminta setelah provinsi asal atau tujuan dipilih. Saat provinsi diganti, pilihan kabupaten/kota sebelumnya dihapus.
- `src/hooks/usePackageImages.js` mengubah respons Wikimedia menjadi data sederhana untuk UI: URL thumbnail, judul, kredit, lisensi, dan tautan sumber. Data kosong, gambar non-foto, kegagalan jaringan, dan retry ditangani terpisah dari JSX.
- `src/context/ShipmentContext.jsx` membuat `ShipmentProvider` dan `useShipmentContext()`. Provider menyimpan pilihan asal/tujuan (`useState`) serta hasil kedua API. `LocationField`, `LocationSummary`, dan `PackageGallery` membacanya langsung melalui context tanpa mengoper props melewati `HomeContent`.

Contoh aliran saat pengguna memilih Jawa Barat sebagai asal: `onChange` memanggil `changeProvince("origin", "32")` → state provider berubah → `useRegencies("32")` meminta kabupaten/kota → opsi asal dan ringkasan diperbarui. Tidak ada mutasi props maupun request saat render. Keadaan loading tampil sebagai teks/skeleton, error menampilkan tombol coba lagi, dan hasil kosong mempunyai pesan tersendiri.

Setiap komponen berada di folder sendiri; `index.jsx` hanya meneruskan export default agar import tetap singkat. `src/components/ui` berisi komponen visual kecil yang digunakan berulang.

## Props dan aliran data

1. `src/data/demoShipments.js` menyediakan objek mock dengan AWB sebagai key, contohnya `shipments["ANT-FRZ-0002"]`.
2. `TrackingPage` menyimpan data itu dalam state `shipments`. Parent mengirimkannya ke `ShipmentResults` melalui props `shipments`, bersama `searchedAwbs`.
3. `ShipmentResults` membaca data yang cocok, memakai `.map()` untuk `ShipmentCard` dan `key={shipment.awb}` yang unik. Komponen anak **tidak mengubah props**.
4. Saat tombol “Lihat Detail” ditekan, anak memanggil callback `onSelect(awb)`; parent memperbarui `selectedAwb` dan `view`. Data paket terpilih lalu dikirim melalui props ke komponen detail.
5. Komponen detail menerima hanya bagian data yang dibutuhkan, misalnya `TemperatureCard` menerima `reading` dan `stage`, sedangkan `EvidenceGallery` menerima `pickup` dan `delivery`.

```text
demoShipments → TrackingPage → props → ShipmentResults / ShipmentDetail
                                ← callback onSelect(awb) dari tombol
```

## State yang digunakan

| Lokasi            | State                    | Fungsi                               |
| ----------------- | ------------------------ | ------------------------------------ |
| `TrackingPage`    | `shipments`              | Dataset mock lokal                   |
| `TrackingPage`    | `view`                   | Memilih beranda, hasil, atau detail  |
| `TrackingPage`    | `searchedAwbs`           | Daftar AWB yang dicari               |
| `TrackingPage`    | `selectedAwb`            | AWB detail yang sedang dibuka        |
| `TrackingPage`    | `toast`                  | Pesan singkat setelah interaksi      |
| `AwbSearchForm`   | `awbs`, `draft`, `error` | Controlled input, chip AWB, validasi |
| `JourneyPanel`    | `activeTab`              | Toggle linimasa/peta                 |
| `EvidenceGallery` | `preview`                | Foto yang sedang diperbesar          |

`AwbSearchForm` adalah **controlled component** karena nilai input berasal dari state `draft` dan berubah melalui `setDraft`. Klik “Lacak Paket” memanggil callback `onSearch(next)`, sehingga daftar AWB bergerak dari anak ke parent secara jelas. `setState` hanya dipanggil di event handler atau timer notifikasi, bukan saat render.

## Conditional rendering dan empty state

- `view === "home"` menampilkan pengantar; `"results"` menampilkan daftar; `"detail"` menampilkan satu paket.
- `shipment.stage === "DELIVERED"` memilih badge hijau dan “Pembacaan suhu akhir”; status lain memakai tampilan perjalanan.
- Hanya AWB yang memiliki data mock dirender. Jika tidak ada kecocokan, hasil menampilkan pesan umum tanpa mengulang AWB yang tidak ditemukan.
- Foto yang belum ada menggunakan placeholder; suhu yang belum dibaca menggunakan kondisi “menunggu”.
- Elemen berulang memakai `key` stabil seperti AWB, ID event, ID segmen, dan ID pembacaan.

## Batasan tahap ini

Data berada di browser untuk pembelajaran, bukan data produksi. Menyembunyikan AWB tak ditemukan di UI tidak mencegah penebakan resi. Pembaruan suhu otomatis tidak diterapkan. Karena perpindahan tampilan memakai state `view`, URL tidak berubah dan tombol Back browser tidak mengembalikan tampilan sebelumnya. Aplikasi ini sudah berjalan dalam satu dokumen tanpa reload, tetapi belum memiliki navigasi berbasis URL.

API eksternal memerlukan internet dan dapat berubah/tidak tersedia. Jika gagal, fitur eksplorasi menampilkan error; pencarian AWB mock tetap bekerja. Gambar Wikimedia tidak disimpan ke database ataupun dianggap foto paket nyata.

## Pemeriksaan

```bash
npm run lint
npm run build
```

Uji manual: cari beberapa AWB, periksa kartu valid dan jumlah hasil, buka detail paket dalam perjalanan/terkirim, buka linimasa/peta, lihat foto dan riwayat suhu, lalu kembali ke hasil/beranda. Periksa juga ukuran layar ponsel dan konsol browser.

Untuk tahap API publik: di beranda amati skeleton galeri dan status “Memuat provinsi”, pilih provinsi asal/tujuan lalu kabupaten/kota, dan periksa ringkasan. Di Network Tab terlihat permintaan ke `emsifa.com` dan `commons.wikimedia.org`. Gunakan mode Offline untuk menguji pesan error dan tombol coba lagi. Pada React DevTools pilih `ShipmentProvider` untuk melihat state pilihan wilayah dan hasil fetching di context. Bukti screenshot untuk LMS dapat memuat loading, data API yang sudah tampil, DevTools, serta `git log --oneline -5`.
