<?php

namespace App\Models\Dataset;

use Illuminate\Database\Eloquent\Model;

/** Read-only database view; public sender and recipient names are masked here. */
class ShipmentPublicSummary extends Model
{
    protected $table = 'shipment_public_summary';

    protected $primaryKey = 'shipment_id';

    public $timestamps = false;
}
