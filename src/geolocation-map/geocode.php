<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

// GET untuk penanda contoh; POST untuk pencarian alamat yang diketik pengguna.
$addresses = [
    'shipment-0014' => 'Bekasi Timur, Kota Bekasi, Jawa Barat, Indonesia',
];
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'POST') {
    if (($_SERVER['HTTP_X_GEOCODE_REQUEST'] ?? '') !== '1') {
        respond(403, ['error' => 'Permintaan pencarian tidak diizinkan.']);
    }
    $address = $_POST['address'] ?? '';
    if (!is_string($address)) {
        respond(422, ['error' => 'Alamat harus berupa teks.']);
    }
    $address = trim($address);
    if (mb_strlen($address) < 3 || mb_strlen($address) > 120 || preg_match('/[\x00-\x1F\x7F]/', $address)) {
        respond(422, ['error' => 'Masukkan alamat sepanjang 3–120 karakter tanpa baris baru.']);
    }
} elseif ($method === 'GET') {
    $id = $_GET['id'] ?? '';
    if (!is_string($id) || !isset($addresses[$id])) {
        respond(404, ['error' => 'Lokasi contoh tidak ditemukan.']);
    }
    $address = $addresses[$id];
} else {
    header('Allow: GET, POST');
    respond(405, ['error' => 'Metode tidak didukung.']);
}

$key = getenv('GOOGLE_GEOCODING_API_KEY');
if ($key === false || $key === '') {
    respond(503, ['error' => 'Key geocoding server belum disiapkan.']);
}

$url = 'https://geocode.googleapis.com/v4/geocode/address/'
    . rawurlencode($address)
    . '?regionCode=ID&languageCode=id';
$request = curl_init($url);
curl_setopt_array($request, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => [
        'X-Goog-Api-Key: ' . $key,
        'X-Goog-FieldMask: results.location,results.formattedAddress',
        'Accept: application/json',
    ],
]);
$body = curl_exec($request);
$status = curl_getinfo($request, CURLINFO_RESPONSE_CODE);
curl_close($request);

if ($body === false || $status !== 200) {
    // Jangan kirim pesan Google mentah: bisa memuat detail internal konfigurasi.
    respond(502, ['error' => 'Geocoding Google belum tersedia. Periksa konfigurasi API dan kuotanya.']);
}

$data = json_decode($body, true);
$location = $data['results'][0]['location'] ?? null;
$lat = $location['latitude'] ?? null;
$lng = $location['longitude'] ?? null;
if (!is_numeric($lat) || !is_numeric($lng)) {
    respond(404, ['error' => 'Koordinat alamat tidak ditemukan.']);
}

respond(200, [
    'lat' => (float) $lat,
    'lng' => (float) $lng,
    'address' => $data['results'][0]['formattedAddress'] ?? $address,
]);
