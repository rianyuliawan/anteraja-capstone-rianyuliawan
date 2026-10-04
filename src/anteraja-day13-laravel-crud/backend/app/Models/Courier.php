<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Courier extends Model
{
    protected $fillable = ['code', 'name', 'rating', 'is_active'];

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }
}
