<?php

namespace App\Models\Dataset;

use Illuminate\Database\Eloquent\Model;

class TemperatureProfile extends Model
{
    protected $table = 'temperature_profiles';

    protected $primaryKey = 'asset_type';

    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';
}
