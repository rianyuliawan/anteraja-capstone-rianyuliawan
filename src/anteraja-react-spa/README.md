# Anteraja Frozen — SPA dengan React Router

Pada tugas sebelumnya, saya memecah antarmuka menjadi komponen React, mengelola input dengan state, lalu mempraktikkan `useEffect`, custom hooks, dan Context API untuk data dari API publik. Tahap ini melanjutkannya dengan **React Router**: beranda, hasil pencarian, detail resi, dan halaman 404 memiliki URL sendiri tanpa memuat ulang halaman.

Eksplorasi wilayah dan galeri dari API publik tidak digunakan pada tahap ini agar fokus pengujian ada pada navigasi SPA. Resi dan detail pengiriman memakai `demoShipments.js`, sedangkan foto paket memakai aset dummy lokal. Peta interaktif memakai *tile* OpenStreetMap; jika tidak tersedia, peta ilustratif tetap ditampilkan.

## Perubahan dari tahap sebelumnya

| React sebelumnya | React SPA sekarang |
| --- | --- |
| Beranda, hasil, dan detail dipilih lewat state tampilan; URL tetap sama. | React Router memberi URL berbeda untuk tiap halaman. |
| Data resi mengalir dari komponen induk lewat props. | `ShipmentProvider` menyediakan data resi untuk halaman hasil dan detail. |
| Tombol mengubah tampilan melalui `setState`. | Form dan tombol memakai `useNavigate()`; tautan memakai `<Link>` atau `<NavLink>`. |
| Refresh selalu kembali ke beranda. | URL detail resi dapat dibuka langsung atau di-refresh. |

## Menjalankan

```bash
cd src/anteraja-react-spa
npm install
npm run dev
```

Jalankan `npm run lint` dan `npm run build` untuk pemeriksaan. Contoh AWB: `ANT-FRZ-0002` (dalam perjalanan), `ANT-FRZ-0006` (diantar), `ANT-FRZ-0009` (di hub), dan `ANT-FRZ-0012` (terkirim). Pencarian menerima sampai 10 resi yang dipisah koma.

## Route Map

| URL | Komponen | Perilaku |
| --- | --- | --- |
| `/` | `Home` | Beranda dan formulir AWB. |
| `/shipments` | `Results` | Daftar hasil atau petunjuk pencarian saat belum ada AWB. |
| `/shipments/:id` | `Tracking` | Detail resi. `:id` adalah AWB, misalnya `/shipments/ANT-FRZ-0012`. |
| `*` | `NotFound` | Halaman 404 dan tautan kembali ke beranda. |

`main.jsx` membungkus semua rute dengan `BrowserRouter` dan `ShipmentProvider`. `SiteLayout` adalah rute induk yang menampilkan `SiteHeader`, `<Outlet />`, bantuan pelanggan, toast, dan `SiteFooter`. Komponen layout tetap terpasang ketika anak rute berganti; perpindahan halaman tidak memuat ulang dokumen HTML.

Logo pada header memakai `<NavLink>` ke beranda. Tautan kembali dan halaman 404 memakai `<Link>`. Setelah formulir AWB dikirim, `Home` memakai `useNavigate()` menuju `/shipments`; tombol “Lihat Detail” di hasil memakai `useNavigate()` menuju `/shipments/:id`.

`Tracking` memanggil `useParams()` untuk membaca `id`, mengubahnya menjadi AWB huruf kapital, lalu mengambil `shipments[id]` dari `useShipmentContext()`. Bila resi tidak ditemukan, halaman detail memberi pesan umum dan tautan kembali, bukan melempar error. URL detail dapat dibuka langsung atau di-refresh selama server menyediakan fallback ke `index.html` (Vite dev server sudah mendukungnya).

## Data dan Context

```text
demoShipments.js → useTrackingDemo() → ShipmentProvider
                                      ├─ Home: menyimpan AWB pencarian
                                      ├─ Results: memilih resi yang valid
                                      └─ Tracking: mencari data dari parameter URL
```

`ShipmentProvider` menyimpan `shipments`, waktu tampilan `now`, serta daftar `searchedAwbs`. Komponen mengaksesnya lewat custom hook `useShipmentContext()`; tidak perlu mengoper dataset melalui setiap lapisan komponen. `SiteLayout` hanya mengirim fungsi `showToast` lewat context milik `<Outlet />`. Simulasi pembaruan suhu lokal hanya berjalan selama halaman terbuka.

## Batasan dan uji manual

- Data resi adalah mock untuk menguji routing, bukan kondisi paket nyata.
- Daftar pencarian berada dalam state memori. Refresh `/shipments` membuat daftar kosong, tetapi refresh `/shipments/ANT-FRZ-0012` tetap dapat membuka detail dari dataset lokal.
- Peta Leaflet memakai tile eksternal dan bukan posisi GPS langsung. Jika tile gagal, peta ilustratif tetap tersedia.
- Uji rute beranda → hasil → detail → kembali, masukkan URL detail langsung, serta buka URL salah seperti `/tidak-ada` untuk 404. Cek pada lebar 375px, 768px, dan 1440px, juga pastikan tidak ada error/warning konsol.
