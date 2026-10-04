<?php

declare(strict_types=1);

require_once __DIR__ . '/temperature-functions.php';

// Data latihan satu aset. Di aplikasi utama, pembacaan nyata berasal dari database.
$kodeAset = 'REEFER-BOX-01';
$batasAtasC = -18.0;
$bacaan = [-20.5, -19.2, -15.8, -18.4];

$hasil = analisisSuhu($bacaan, $batasAtasC);

if (PHP_SAPI !== 'cli') {
    header('Content-Type: text/plain; charset=utf-8');
}

echo "Analisis suhu aset {$kodeAset}\n";
echo 'Data simulasi: ' . implode(', ', $bacaan) . " °C\n";
echo "Batas atas contoh: {$batasAtasC} °C\n";
echo "Tertinggi: {$hasil['tertinggi']} °C\n";
echo "Terendah: {$hasil['terendah']} °C\n";
echo "Rata-rata: {$hasil['rata']} °C\n";
echo "Rentetan pelanggaran terpanjang: {$hasil['rentetan_terpanjang']} pembacaan\n";

if ($hasil['pelanggaran'] > 0) {
    echo "PERINGATAN: {$hasil['pelanggaran']} pembacaan melewati batas.\n";
} else {
    echo "Semua pembacaan berada dalam batas contoh.\n";
}

if ($hasil['rentetan_terpanjang'] >= 2) {
    echo "ALARM CONTOH: setidaknya dua pembacaan berturut-turut melewati batas.\n";
}
