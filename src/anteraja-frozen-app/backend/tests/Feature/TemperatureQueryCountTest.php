<?php

namespace Tests\Feature;

use App\Services\DatasetTemperatureService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TemperatureQueryCountTest extends TestCase
{
    public function test_processing_multiple_readings_does_not_query_each_asset_separately(): void
    {
        Schema::create('temperature_profiles', function (Blueprint $table): void {
            $table->string('asset_type')->primary();
            $table->decimal('normal_low_c');
            $table->decimal('normal_high_c');
            $table->decimal('warning_low_c');
            $table->decimal('warning_high_c');
        });

        Schema::create('thermal_assets', function (Blueprint $table): void {
            $table->id();
            $table->string('asset_code');
            $table->string('asset_type');
            $table->boolean('is_active');
        });

        Schema::create('temperature_readings', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('thermal_asset_id');
            $table->string('source');
            $table->string('message_id');
            $table->timestamp('observed_at');
            $table->decimal('temperature_c');
            $table->string('temperature_status');
        });

        DB::table('temperature_profiles')->insert([
            'asset_type' => 'COOLER_BAG',
            'normal_low_c' => -8,
            'normal_high_c' => -2,
            'warning_low_c' => -10,
            'warning_high_c' => 0,
        ]);

        $observedAt = now()->subMinute()->utc()->toIso8601String();
        $readings = [];

        foreach (range(1, 5) as $number) {
            DB::table('thermal_assets')->insert([
                'id' => $number,
                'asset_code' => "BAG-{$number}",
                'asset_type' => 'COOLER_BAG',
                'is_active' => true,
            ]);
            DB::table('temperature_readings')->insert([
                'thermal_asset_id' => $number,
                'source' => 'NODE_RED',
                'message_id' => "query-count-{$number}",
                'observed_at' => $observedAt,
                'temperature_c' => -5,
                'temperature_status' => 'NORMAL',
            ]);
            $readings[] = [
                'asset_code' => "BAG-{$number}",
                'message_id' => "query-count-{$number}",
                'observed_at' => $observedAt,
                'temperature_c' => -5,
            ];
        }

        $selects = [];
        DB::listen(function ($query) use (&$selects): void {
            if (str_starts_with(strtolower($query->sql), 'select')) {
                $selects[] = $query->sql;
            }
        });

        $service = app(DatasetTemperatureService::class);
        $single = $service->save([$readings[0]]);
        $singleQueryCount = count($selects);

        $multiple = $service->save($readings);
        $multipleQueryCount = count($selects) - $singleQueryCount;

        $this->assertSame(1, $single['duplicates']);
        $this->assertSame(5, $multiple['duplicates']);
        $this->assertSame(3, $singleQueryCount);
        $this->assertSame($singleQueryCount, $multipleQueryCount);
    }
}
