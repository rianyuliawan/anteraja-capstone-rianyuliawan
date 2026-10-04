<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'message' => 'Laravel API Day 13 aktif. Buka frontend React di http://127.0.0.1:5195/',
]));
