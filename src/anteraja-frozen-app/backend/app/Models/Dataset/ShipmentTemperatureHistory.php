<?php

namespace App\Models\Dataset;

use Illuminate\Database\Eloquent\Model;

/** Read-only view: scheduled samples or last asset readings associated at handoff. */
class ShipmentTemperatureHistory extends Model
{
    protected $table = 'shipment_temperature_history';

    public $timestamps = false;
}
