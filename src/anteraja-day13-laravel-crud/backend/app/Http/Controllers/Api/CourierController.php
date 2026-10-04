<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Courier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourierController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['couriers' => Courier::query()->withCount('shipments')->orderBy('name')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        return response()->json(['courier' => Courier::create($data)], 201);
    }

    public function show(Courier $courier): JsonResponse
    {
        return response()->json(['courier' => $courier->loadCount('shipments')]);
    }

    public function update(Request $request, Courier $courier): JsonResponse
    {
        $courier->update($request->validate($this->rules($courier)));

        return response()->json(['courier' => $courier->fresh()]);
    }

    public function destroy(Courier $courier): JsonResponse
    {
        if ($courier->shipments()->exists()) {
            return response()->json(['message' => 'Kurir masih dipakai pengiriman.'], 409);
        }
        $courier->delete();

        return response()->json([], 204);
    }

    private function rules(?Courier $courier = null): array
    {
        return [
            'code' => ['required', 'regex:/^[A-Z0-9][A-Z0-9-]{1,29}$/', Rule::unique('couriers', 'code')->ignore($courier?->id)],
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'rating' => ['required', 'numeric', 'between:0,5'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
