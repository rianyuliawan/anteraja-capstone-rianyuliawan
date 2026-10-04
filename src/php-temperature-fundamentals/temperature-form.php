<?php

declare(strict_types=1);

require_once __DIR__ . '/session-helpers.php';
startTemperatureSession();

$error = $_SESSION['form_error'] ?? '';
$old = $_SESSION['old_input'] ?? [];
unset($_SESSION['form_error'], $_SESSION['old_input']);

$assetCode = is_string($old['asset_code'] ?? null) ? $old['asset_code'] : 'REEFER-BOX-01';
$readings = is_string($old['readings'] ?? null) ? $old['readings'] : '-20.5, -19.2, -15.8, -18.4';
$upperLimit = is_string($old['upper_limit'] ?? null) ? $old['upper_limit'] : '-18';
$historyCount = count($_SESSION['temperature_requests'] ?? []);
?>
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Permintaan Analisis Suhu | Anteraja Frozen</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="site-header">
        <div class="container header-inner">
            <a class="brand" href="temperature-form.php" aria-label="Beranda latihan Anteraja Frozen">anteraja<span class="brand-dot">.</span></a>
            <nav class="header-nav" aria-label="Navigasi latihan">
                <a aria-current="page" href="temperature-form.php">Form</a>
                <a href="request-history.php">Riwayat (<?= $historyCount ?>)</a>
            </nav>
        </div>
    </header>

    <main class="container main-content">
        <section class="intro" aria-labelledby="page-title">
            <p class="eyebrow">Frozen Temperature Traceability System</p>
            <h1 id="page-title">Permintaan analisis suhu</h1>
            <p>Isi data suhu simulasi. PHP akan memvalidasi input, menghitung hasilnya, lalu menyimpan permintaan yang berhasil ke riwayat session browser ini.</p>
        </section>

        <section class="panel" aria-labelledby="form-title">
            <div class="section-heading">
                <div>
                    <h2 id="form-title">Data aset dan pembacaan</h2>
                    <p>Form ini adalah latihan OOP dan session, bukan telemetri langsung.</p>
                </div>
                <span class="sample-tag">Day 12 · PHP</span>
            </div>

            <?php if ($error !== ''): ?>
                <p class="error-message" id="form-error" role="alert"><?= escapeHtml((string) $error) ?></p>
            <?php endif; ?>

            <form method="post" action="submit-request.php">
                <input type="hidden" name="csrf_token" value="<?= escapeHtml(csrfToken()) ?>">
                <div class="form-grid form-grid-request">
                    <div class="field">
                        <label for="asset-code">Kode aset</label>
                        <input id="asset-code" name="asset_code" type="text" maxlength="50" pattern="[A-Z0-9-]{3,50}" value="<?= escapeHtml($assetCode) ?>" required <?= $error !== '' ? 'aria-describedby="form-error"' : '' ?>>
                        <small>Contoh: REEFER-BOX-01. Data hanya untuk latihan.</small>
                    </div>
                    <div class="field">
                        <label for="upper-limit">Batas atas contoh (°C)</label>
                        <input id="upper-limit" name="upper_limit" type="number" min="-60" max="40" step="any" value="<?= escapeHtml($upperLimit) ?>" required>
                        <small>Suhu yang lebih hangat dari batas dihitung sebagai pelanggaran.</small>
                    </div>
                    <div class="field field-full">
                        <label for="readings">Daftar pembacaan suhu (°C)</label>
                        <textarea id="readings" name="readings" rows="3" required aria-describedby="readings-help"><?= escapeHtml($readings) ?></textarea>
                        <small id="readings-help">Pisahkan dengan koma. Contoh: -20.5, -19.2, -15.8. Maksimal 100 bacaan.</small>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit">Simpan dan analisis</button>
                    <a href="request-history.php">Lihat riwayat</a>
                </div>
            </form>
        </section>

        <p class="disclaimer">Session hanya menyimpan data selama session browser masih berlaku. Data ini tidak masuk ke PostgreSQL/Aiven dan tidak memengaruhi aplikasi pelacakan utama.</p>
    </main>
</body>
</html>
