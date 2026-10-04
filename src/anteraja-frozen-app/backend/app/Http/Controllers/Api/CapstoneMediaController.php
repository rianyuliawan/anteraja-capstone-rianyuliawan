<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dataset\ShipmentPublicEventMedia;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class CapstoneMediaController extends Controller
{
    public function show(string $awb, int $mediaId): BinaryFileResponse
    {
        $media = ShipmentPublicEventMedia::query()->from('shipment_public_event_media as m')
            ->join('shipments as s', 's.id', '=', 'm.shipment_id')
            ->where('s.awb', strtoupper($awb))
            ->where('m.media_id', $mediaId)
            ->whereIn('m.privacy_status', ['APPROVED', 'REDACTED'])
            ->first(['m.storage_key', 'm.mime_type']);

        if (! $media || $media->mime_type !== 'image/webp' ||
            ! str_starts_with($media->storage_key, 'shipment-events/') ||
            str_contains($media->storage_key, '..') ||
            ! Storage::disk('local')->exists($media->storage_key)) {
            abort(404);
        }

        return response()->file(Storage::disk('local')->path($media->storage_key), [
            'Content-Type' => 'image/webp',
            'Cache-Control' => 'private, max-age=300',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
