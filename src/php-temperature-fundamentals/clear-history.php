<?php

declare(strict_types=1);

require_once __DIR__ . '/session-helpers.php';
startTemperatureSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Gunakan tombol pada halaman riwayat.');
}

if (!validCsrfToken($_POST['csrf_token'] ?? null)) {
    http_response_code(403);
    exit('Permintaan tidak valid. Muat ulang halaman riwayat dan coba lagi.');
}

unset($_SESSION['temperature_requests']);
redirectTo('request-history.php?cleared=1');
