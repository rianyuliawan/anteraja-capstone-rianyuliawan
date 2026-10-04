<?php

declare(strict_types=1);

require_once __DIR__ . '/../TemperatureAnalysisRequest.php';

$request = new TemperatureAnalysisRequest('REEFER-BOX-01', [-20.5, -19.2, -15.8, -18.4], -18.0);
$result = $request->analyze();
if ($result['pelanggaran'] !== 1 || $result['rentetan_terpanjang'] !== 1) {
    throw new RuntimeException('Method analyze() menghasilkan ringkasan yang salah.');
}

$entry = $request->toHistoryEntry();
if ($entry['asset_code'] !== 'REEFER-BOX-01' || $entry['result'] !== $result || !is_string($entry['submitted_at'])) {
    throw new RuntimeException('Data riwayat tidak lengkap.');
}

foreach ([
    ['BAD CODE', [-18.0], -18.0],
    ['REEFER-BOX-01', [], -18.0],
    ['REEFER-BOX-01', [-18.0], 41.0],
    ['REEFER-BOX-01', [-61.0], -18.0],
] as [$assetCode, $readings, $limit]) {
    try {
        new TemperatureAnalysisRequest($assetCode, $readings, $limit);
        throw new RuntimeException('Input tidak valid seharusnya ditolak.');
    } catch (InvalidArgumentException) {
        // Validasi berjalan sesuai harapan.
    }
}

echo "Pengujian class permintaan suhu lulus.\n";
