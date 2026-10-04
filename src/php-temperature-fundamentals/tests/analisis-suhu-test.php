<?php

declare(strict_types=1);

require_once __DIR__ . '/../temperature-functions.php';

function periksa(bool $kondisi, string $pesan): void
{
    if (!$kondisi) {
        throw new RuntimeException($pesan);
    }
}

$hasil = analisisSuhu([-20.5, -19.2, -15.8, -18.4], -18.0);
periksa($hasil['tertinggi'] === -15.8, 'Suhu tertinggi salah.');
periksa($hasil['terendah'] === -20.5, 'Suhu terendah salah.');
periksa($hasil['rata'] === -18.5, 'Rata-rata salah.');
periksa($hasil['pelanggaran'] === 1, 'Jumlah pelanggaran salah.');
periksa($hasil['rentetan_terpanjang'] === 1, 'Rentetan pelanggaran contoh salah.');

$aman = analisisSuhu([-21.0, -19.0, -18.0], -18.0);
periksa($aman['pelanggaran'] === 0, 'Suhu tepat di batas tidak boleh dihitung sebagai pelanggaran.');
periksa($aman['rentetan_terpanjang'] === 0, 'Data aman tidak boleh menghasilkan rentetan pelanggaran.');

$beruntun = analisisSuhu([-17.0, -16.0, -19.0, -15.0], -18.0);
periksa($beruntun['pelanggaran'] === 3, 'Total pelanggaran beruntun salah.');
periksa($beruntun['rentetan_terpanjang'] === 2, 'Rekursi harus menemukan rentetan dua pembacaan.');

try {
    analisisSuhu([], -18.0);
    throw new RuntimeException('Daftar kosong seharusnya ditolak.');
} catch (InvalidArgumentException $e) {
    periksa($e->getMessage() === 'Daftar suhu tidak boleh kosong.', 'Pesan validasi salah.');
}

echo "Semua pengujian analisis suhu lulus.\n";
