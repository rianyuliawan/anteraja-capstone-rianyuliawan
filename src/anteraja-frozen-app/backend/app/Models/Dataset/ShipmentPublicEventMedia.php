<?php

namespace App\Models\Dataset;

use Illuminate\Database\Eloquent\Model;

/** Read-only view containing approved or redacted event media. */
class ShipmentPublicEventMedia extends Model
{
    protected $table = 'shipment_public_event_media';

    protected $primaryKey = 'media_id';

    public $timestamps = false;
}
