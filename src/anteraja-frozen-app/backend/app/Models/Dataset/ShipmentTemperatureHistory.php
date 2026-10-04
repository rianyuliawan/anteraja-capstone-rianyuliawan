<?php

namespace App\Models\Dataset;

use Illuminate\Database\Eloquent\Model;

/** Read-only view: a reading belongs to a shipment only during asset assignment. */
class ShipmentTemperatureHistory extends Model
{
    protected $table = 'shipment_temperature_history';

    public $timestamps = false;
}
