<?php

namespace App\Models\Dataset;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThermalAsset extends Model
{
    protected $table = 'thermal_assets';

    public function profile(): BelongsTo
    {
        return $this->belongsTo(TemperatureProfile::class, 'asset_type', 'asset_type');
    }
}
