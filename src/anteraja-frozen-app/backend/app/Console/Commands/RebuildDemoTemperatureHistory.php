<?php

namespace App\Console\Commands;

use App\Services\DemoTemperatureHistoryService;
use Illuminate\Console\Command;

class RebuildDemoTemperatureHistory extends Command
{
    protected $signature = 'temperature:rebuild-demo';

    protected $description = 'Susun ulang riwayat suhu demo semua paket dari pembacaan aset setiap jam';

    public function handle(DemoTemperatureHistoryService $service): int
    {
        $result = $service->rebuild();
        $this->info("{$result['shipments']} paket; {$result['samples']} cuplikan suhu demo.");

        return self::SUCCESS;
    }
}
