<?php

declare(strict_types=1);

require_once __DIR__ . '/session-helpers.php';
require_once __DIR__ . '/TemperatureAnalysisRequest.php';
startTemperatureSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Gunakan formulir untuk mengirim permintaan.');
}

if (!validCsrfToken($_POST['csrf_token'] ?? null)) {
    http_response_code(403);
    exit('Formulir tidak valid. Muat ulang halaman formulir dan coba lagi.');
}

$assetCode = $_POST['asset_code'] ?? null;
$rawReadings = $_POST['readings'] ?? null;
$rawLimit = $_POST['upper_limit'] ?? null;

try {
    if (!is_string($assetCode) || trim($assetCode) === '') {
        throw new InvalidArgumentException('Kode aset wajib diisi.');
    }
    if (!is_string($rawLimit) || trim($rawLimit) === '' || !is_numeric($rawLimit)) {
        throw new InvalidArgumentException('Batas suhu wajib berupa angka.');
    }
    if (!is_string($rawReadings) || trim($rawReadings) === '') {
        throw new InvalidArgumentException('Daftar pembacaan suhu wajib diisi.');
    }

    $parts = explode(',', $rawReadings);
    if (count($parts) > 100) {
        throw new InvalidArgumentException('Maksimal 100 pembacaan suhu.');
    }

    $readings = [];
    foreach ($parts as $part) {
        $part = trim($part);
        if ($part === '' || !is_numeric($part)) {
            throw new InvalidArgumentException('Pisahkan pembacaan dengan koma dan isi setiap nilai dengan angka.');
        }
        $readings[] = (float) $part;
    }

    $request = new TemperatureAnalysisRequest(trim($assetCode), $readings, (float) $rawLimit);
    $_SESSION['temperature_requests'][] = $request->toHistoryEntry();
    redirectTo('request-history.php?saved=1');
} catch (InvalidArgumentException $exception) {
    $_SESSION['form_error'] = $exception->getMessage();
    $_SESSION['old_input'] = [
        'asset_code' => is_string($assetCode) ? $assetCode : '',
        'readings' => is_string($rawReadings) ? $rawReadings : '',
        'upper_limit' => is_string($rawLimit) ? $rawLimit : '',
    ];
    redirectTo('temperature-form.php');
}
