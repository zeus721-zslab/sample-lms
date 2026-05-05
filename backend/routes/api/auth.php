<?php

use Illuminate\Support\Facades\Route;

// 로그인 · 회원가입 등 인증 불필요 라우트
Route::post('/login', [\App\Http\Controllers\Auth\AuthController::class, 'login']);
Route::post('/register', [\App\Http\Controllers\Auth\AuthController::class, 'register']);
