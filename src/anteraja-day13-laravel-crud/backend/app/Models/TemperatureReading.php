<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemperatureReading extends Model
{
    protected $fillable = [
        'thermal_asset_id', 'source', 'message_id', 'temperature_c',
        'temperature_status', 'observed_at',
    ];

    protected function casts(): array
    {
        return ['observed_at' => 'datetime'];
    }

    public function thermalAsset(): BelongsTo
    {
        return $this->belongsTo(ThermalAsset::class);
    }
}
