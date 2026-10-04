<?php

declare(strict_types=1);

require_once __DIR__ . '/temperature-functions.php';

/** Satu permintaan analisis suhu untuk data latihan, bukan data sensor nyata. */
final class TemperatureAnalysisRequest
{
    /** @param list<float> $readings */
    public function __construct(
        private string $assetCode,
        private array $readings,
        private float $upperLimitC
    ) {
        if (!preg_match('/^[A-Z0-9-]{3,50}$/', $assetCode)) {
            throw new InvalidArgumentException('Kode aset harus 3–50 karakter: huruf besar, angka, atau tanda hubung.');
        }

        if ($readings === [] || count($readings) > 100) {
            throw new InvalidArgumentException('Isi 1 sampai 100 pembacaan suhu.');
        }

        if (!is_finite($upperLimitC) || $upperLimitC < -60 || $upperLimitC > 40) {
            throw new InvalidArgumentException('Batas suhu harus berada antara -60 dan 40 °C.');
        }

        foreach ($readings as $reading) {
            if (!is_float($reading) || !is_finite($reading) || $reading < -60 || $reading > 40) {
                throw new InvalidArgumentException('Setiap pembacaan harus berupa angka antara -60 dan 40 °C.');
            }
        }
    }

    /** @return array{tertinggi: float, terendah: float, rata: float, pelanggaran: int, rentetan_terpanjang: int} */
    public function analyze(): array
    {
        return analisisSuhu($this->readings, $this->upperLimitC);
    }

    /** Simpan nilai biasa ke session, bukan objek PHP yang bergantung pada class. */
    public function toHistoryEntry(): array
    {
        return [
            'asset_code' => $this->assetCode,
            'readings' => $this->readings,
            'upper_limit_c' => $this->upperLimitC,
            'result' => $this->analyze(),
            'submitted_at' => (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format(DATE_ATOM),
        ];
    }
}
