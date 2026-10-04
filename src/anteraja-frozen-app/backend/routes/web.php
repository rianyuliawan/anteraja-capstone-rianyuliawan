<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'message' => 'Anteraja Frozen API aktif. Buka frontend React di http://127.0.0.1:5195/',
]));
