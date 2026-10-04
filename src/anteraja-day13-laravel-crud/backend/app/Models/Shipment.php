<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shipment extends Model
{
    protected $fillable = [
        'awb', 'sender_name', 'recipient_name', 'origin', 'destination',
        'weight_kg', 'status', 'courier_id', 'thermal_asset_id',
    ];

    public function courier(): BelongsTo
    {
        return $this->belongsTo(Courier::class);
    }

    public function thermalAsset(): BelongsTo
    {
        return $this->belongsTo(ThermalAsset::class);
    }
}
