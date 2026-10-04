<?php

declare(strict_types=1);

require_once __DIR__ . '/session-helpers.php';
startTemperatureSession();

$entries = array_reverse($_SESSION['temperature_requests'] ?? []);
$saved = ($_GET['saved'] ?? '') === '1';
$cleared = ($_GET['cleared'] ?? '') === '1';
?>
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Riwayat Analisis Suhu | Anteraja Frozen</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="site-header">
        <div class="container header-inner">
            <a class="brand" href="temperature-form.php" aria-label="Beranda latihan Anteraja Frozen">anteraja<span class="brand-dot">.</span></a>
            <nav class="header-nav" aria-label="Navigasi latihan">
                <a href="temperature-form.php">Form</a>
                <a aria-current="page" href="request-history.php">Riwayat (<?= count($entries) ?>)</a>
            </nav>
        </div>
    </header>

    <main class="container main-content">
        <section class="intro" aria-labelledby="page-title">
            <p class="eyebrow">Frozen Temperature Traceability System</p>
            <h1 id="page-title">Riwayat permintaan</h1>
            <p>Setiap analisis yang lolos validasi tersimpan dalam session browser ini. Membuka atau memuat ulang halaman tidak mengulang pengiriman formulir.</p>
        </section>

        <?php if ($saved): ?>
            <p class="success-message" role="status">Permintaan berhasil dianalisis dan disimpan.</p>
        <?php elseif ($cleared): ?>
            <p class="success-message" role="status">Riwayat permintaan sudah dikosongkan.</p>
        <?php endif; ?>

        <section class="panel" aria-labelledby="history-title">
            <div class="section-heading">
                <div>
                    <h2 id="history-title"><?= count($entries) ?> permintaan tersimpan</h2>
                    <p>Data simulasi ini tidak tersimpan dalam database.</p>
                </div>
                <a href="temperature-form.php">Buat analisis baru</a>
            </div>

            <?php if ($entries === []): ?>
                <div class="empty-state">
                    <h3>Belum ada riwayat</h3>
                    <p>Isi formulir dan kirim data suhu untuk melihat hasil analisis di sini.</p>
                    <a href="temperature-form.php">Buka formulir</a>
                </div>
            <?php else: ?>
                <div class="history-list">
                    <?php foreach ($entries as $position => $entry): ?>
                        <?php $result = $entry['result']; ?>
                        <article class="history-card" aria-labelledby="entry-<?= $position ?>">
                            <div class="history-card-heading">
                                <div>
                                    <p class="eyebrow">Aset simulasi</p>
                                    <h3 id="entry-<?= $position ?>"><?= escapeHtml($entry['asset_code']) ?></h3>
                                    <p class="history-time">Dikirim <?= escapeHtml((new DateTimeImmutable($entry['submitted_at']))->format('d-m-Y H.i')) ?> WIB</p>
                                </div>
                                <span class="status <?= $result['pelanggaran'] > 0 ? 'status-warning' : 'status-safe' ?>">
                                    <?= $result['pelanggaran'] > 0 ? 'Perlu perhatian' : 'Dalam batas contoh' ?>
                                </span>
                            </div>
                            <dl class="metrics history-metrics">
                                <div><dt>Bacaan</dt><dd><?= count($entry['readings']) ?></dd></div>
                                <div><dt>Batas atas</dt><dd><?= formatTemperature($entry['upper_limit_c']) ?> <span>°C</span></dd></div>
                                <div><dt>Rata-rata</dt><dd><?= formatTemperature($result['rata']) ?> <span>°C</span></dd></div>
                                <div><dt>Melewati batas</dt><dd><?= $result['pelanggaran'] ?> <span>bacaan</span></dd></div>
                            </dl>
                            <p class="history-detail">Terendah <?= formatTemperature($result['terendah']) ?> °C · Tertinggi <?= formatTemperature($result['tertinggi']) ?> °C · Rentetan terpanjang <?= $result['rentetan_terpanjang'] ?> bacaan</p>
                            <details class="reading-details">
                                <summary>Lihat pembacaan</summary>
                                <div class="table-scroll">
                                    <table>
                                        <thead><tr><th scope="col">Urutan</th><th scope="col">Suhu</th><th scope="col">Status</th></tr></thead>
                                        <tbody>
                                            <?php foreach ($entry['readings'] as $index => $reading): ?>
                                                <tr>
                                                    <td><?= $index + 1 ?></td>
                                                    <td><?= formatTemperature($reading) ?> °C</td>
                                                    <td><?= $reading > $entry['upper_limit_c'] ? 'Melewati batas' : 'Dalam batas' ?></td>
                                                </tr>
                                            <?php endforeach; ?>
                                        </tbody>
                                    </table>
                                </div>
                            </details>
                        </article>
                    <?php endforeach; ?>
                </div>
                <form method="post" action="clear-history.php" class="clear-form">
                    <input type="hidden" name="csrf_token" value="<?= escapeHtml(csrfToken()) ?>">
                    <button type="submit" class="button-secondary">Hapus seluruh riwayat</button>
                </form>
            <?php endif; ?>
        </section>

        <p class="disclaimer">Riwayat hanya berlaku pada session browser ini. Ini bukan catatan pengiriman atau telemetri aset di aplikasi utama.</p>
    </main>
</body>
</html>
