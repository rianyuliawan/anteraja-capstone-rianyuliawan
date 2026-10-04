<?php

declare(strict_types=1);

/**
 * Menghitung rentetan terpanjang bacaan yang melewati batas secara rekursif.
 * Setiap pemanggilan memproses satu bacaan, lalu lanjut ke indeks berikutnya.
 *
 * @param list<int|float> $daftarSuhu
 */
function rentetanPelanggaranTerpanjang(
    array $daftarSuhu,
    float $batasAtasC,
    int $indeks = 0,
    int $rentetanSaatIni = 0,
    int $terpanjang = 0
): int {
    // Base case: semua bacaan sudah diperiksa, maka rekursi berhenti.
    if ($indeks >= count($daftarSuhu)) {
        return $terpanjang;
    }

    if ($daftarSuhu[$indeks] > $batasAtasC) {
        $rentetanSaatIni++;
    } else {
        $rentetanSaatIni = 0;
    }

    return rentetanPelanggaranTerpanjang(
        $daftarSuhu,
        $batasAtasC,
        $indeks + 1,
        $rentetanSaatIni,
        max($terpanjang, $rentetanSaatIni)
    );
}

/**
 * Merangkum pembacaan suhu dari satu aset pada data latihan.
 * Batas atas dan data suhu hanyalah contoh, bukan aturan operasional Anteraja.
 *
 * @param array<int, int|float> $daftarSuhu
 * @return array{tertinggi: float, terendah: float, rata: float, pelanggaran: int, rentetan_terpanjang: int}
 */
function analisisSuhu(array $daftarSuhu, float $batasAtasC): array
{
    if ($daftarSuhu === []) {
        throw new InvalidArgumentException('Daftar suhu tidak boleh kosong.');
    }

    $pelanggaran = 0;

    foreach ($daftarSuhu as $suhu) {
        if ((!is_int($suhu) && !is_float($suhu)) || !is_finite((float) $suhu)) {
            throw new InvalidArgumentException('Setiap pembacaan harus berupa angka suhu yang valid.');
        }

        if ($suhu > $batasAtasC) {
            $pelanggaran++;
        }
    }

    return [
        'tertinggi' => (float) max($daftarSuhu),
        'terendah' => (float) min($daftarSuhu),
        'rata' => round(array_sum($daftarSuhu) / count($daftarSuhu), 1),
        'pelanggaran' => $pelanggaran,
        'rentetan_terpanjang' => rentetanPelanggaranTerpanjang(array_values($daftarSuhu), $batasAtasC),
    ];
}
