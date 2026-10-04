<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ThermalAsset extends Model
{
    protected $fillable = [
        'code', 'name', 'type', 'target_c', 'normal_low_c', 'normal_high_c',
        'warning_low_c', 'warning_high_c', 'is_active',
    ];

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    public function readings(): HasMany
    {
        return $this->hasMany(TemperatureReading::class);
    }
}
