<?php

declare(strict_types=1);

require_once __DIR__ . '/temperature-functions.php';

$kodeAset = 'REEFER-BOX-01';
$rawSuhu = $_GET['suhu'] ?? '-20.5, -19.2, -15.8, -18.4';
$rawBatas = $_GET['batas'] ?? '-18';
$inputSuhu = is_string($rawSuhu) ? trim($rawSuhu) : '';
$inputBatas = is_string($rawBatas) ? trim($rawBatas) : '';
$bacaan = [];
$hasil = null;
$error = '';

try {
    if (!is_numeric($inputBatas) || !is_finite((float) $inputBatas)) {
        throw new InvalidArgumentException('Batas suhu harus berupa angka.');
    }

    $batasAtasC = (float) $inputBatas;
    if ($batasAtasC < -60 || $batasAtasC > 40) {
        throw new InvalidArgumentException('Batas suhu harus berada antara -60 dan 40 °C.');
    }

    $bagian = explode(',', $inputSuhu);
    if (count($bagian) > 100) {
        throw new InvalidArgumentException('Maksimal 100 pembacaan dalam satu analisis.');
    }

    foreach ($bagian as $nilai) {
        $nilai = trim($nilai);
        if ($nilai === '' || !is_numeric($nilai) || !is_finite((float) $nilai)) {
            throw new InvalidArgumentException('Pisahkan suhu dengan koma dan isi setiap bacaan dengan angka.');
        }

        $suhu = (float) $nilai;
        if ($suhu < -60 || $suhu > 40) {
            throw new InvalidArgumentException('Setiap pembacaan harus berada antara -60 dan 40 °C.');
        }

        $bacaan[] = $suhu;
    }

    $hasil = analisisSuhu($bacaan, $batasAtasC);
} catch (InvalidArgumentException $exception) {
    $error = $exception->getMessage();
}

function tampil(float $angka): string
{
    return number_format($angka, 1, ',', '.');
}

function aman(string $teks): string
{
    return htmlspecialchars($teks, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

?>
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Analisis Suhu Aset | Anteraja Frozen</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="site-header">
        <div class="container header-inner">
            <span class="brand" aria-label="Anteraja Frozen">anteraja<span class="brand-dot">.</span></span>
            <span class="header-label">Latihan PHP dasar</span>
        </div>
    </header>

    <main class="container main-content">
        <section class="intro" aria-labelledby="page-title">
            <p class="eyebrow">Frozen Temperature Traceability System</p>
            <h1 id="page-title">Analisis suhu aset</h1>
            <p>Masukkan pembacaan suhu untuk melihat nilai tertinggi, terendah, rata-rata, serta pelanggaran batas. Hasil dihitung oleh PHP di server.</p>
            <p><a href="temperature-form.php">Lanjut ke latihan OOP, form POST, dan riwayat session</a></p>
        </section>

        <section class="panel" aria-labelledby="form-title">
            <div class="section-heading">
                <div>
                    <h2 id="form-title">Data pembacaan</h2>
                    <p>Data simulasi untuk aset <strong><?= aman($kodeAset) ?></strong>.</p>
                </div>
                <span class="sample-tag">Contoh pembelajaran</span>
            </div>

            <form method="get" action="index.php">
                <div class="form-grid">
                    <div class="field">
                        <label for="suhu">Daftar suhu (°C)</label>
                        <textarea id="suhu" name="suhu" rows="2" required aria-describedby="suhu-help"><?= aman($inputSuhu) ?></textarea>
                        <small id="suhu-help">Pisahkan setiap pembacaan dengan koma, misalnya -20.5, -19.2, -15.8.</small>
                    </div>
                    <div class="field">
                        <label for="batas">Batas atas contoh (°C)</label>
                        <input id="batas" name="batas" type="number" min="-60" max="40" step="0.1" value="<?= aman($inputBatas) ?>" required>
                        <small>Bacaan di atas batas dihitung sebagai pelanggaran.</small>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit">Analisis suhu</button>
                    <a href="index.php">Kembalikan contoh</a>
                </div>
            </form>
        </section>

        <?php if ($error !== ''): ?>
            <p class="error-message" role="alert"><?= aman($error) ?></p>
        <?php elseif ($hasil !== null): ?>
            <section class="results" aria-labelledby="results-title">
                <div class="results-heading">
                    <div>
                        <p class="eyebrow">Hasil analisis</p>
                        <h2 id="results-title"><?= count($bacaan) ?> pembacaan diperiksa</h2>
                    </div>
                    <span class="status <?= $hasil['pelanggaran'] > 0 ? 'status-warning' : 'status-safe' ?>">
                        <?= $hasil['pelanggaran'] > 0 ? 'Perlu perhatian' : 'Dalam batas contoh' ?>
                    </span>
                </div>

                <dl class="metrics">
                    <div><dt>Tertinggi</dt><dd><?= tampil($hasil['tertinggi']) ?> <span>°C</span></dd></div>
                    <div><dt>Terendah</dt><dd><?= tampil($hasil['terendah']) ?> <span>°C</span></dd></div>
                    <div><dt>Rata-rata</dt><dd><?= tampil($hasil['rata']) ?> <span>°C</span></dd></div>
                    <div><dt>Melewati batas</dt><dd><?= $hasil['pelanggaran'] ?> <span>bacaan</span></dd></div>
                </dl>

                <p class="summary <?= $hasil['rentetan_terpanjang'] >= 2 ? 'summary-alert' : '' ?>">
                    <strong>Rentetan terpanjang: <?= $hasil['rentetan_terpanjang'] ?> pembacaan.</strong>
                    <?php if ($hasil['rentetan_terpanjang'] >= 2): ?>
                        Alarm contoh: setidaknya dua bacaan berturut-turut melewati batas.
                    <?php else: ?>
                        Tidak ada dua pelanggaran berturut-turut pada data ini.
                    <?php endif; ?>
                </p>

                <div class="table-panel">
                    <h3>Rincian tiap pembacaan</h3>
                    <div class="table-scroll">
                        <table>
                            <thead><tr><th scope="col">Urutan</th><th scope="col">Suhu</th><th scope="col">Dibanding batas <?= tampil($batasAtasC) ?> °C</th></tr></thead>
                            <tbody>
                            <?php foreach ($bacaan as $urutan => $suhu): ?>
                                <tr>
                                    <td><?= $urutan + 1 ?></td>
                                    <td><?= tampil($suhu) ?> °C</td>
                                    <td><span class="reading-status <?= $suhu > $batasAtasC ? 'reading-warning' : 'reading-safe' ?>"><?= $suhu > $batasAtasC ? 'Melewati batas' : 'Dalam batas' ?></span></td>
                                </tr>
                            <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        <?php endif; ?>

        <p class="disclaimer">Batas dan pembacaan pada halaman ini adalah data latihan, bukan telemetri langsung atau standar untuk seluruh aset. Jumlah bacaan beruntun tidak menunjukkan durasi tanpa data waktu.</p>
    </main>
</body>
</html>
