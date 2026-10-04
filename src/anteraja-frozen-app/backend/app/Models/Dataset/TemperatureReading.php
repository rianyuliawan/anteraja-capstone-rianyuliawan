<?php

namespace App\Models\Dataset;

use Illuminate\Database\Eloquent\Model;

class TemperatureReading extends Model
{
    protected $table = 'temperature_readings';

    public $timestamps = false;
}
