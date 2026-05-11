<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\FaqController;
use App\Http\Controllers\NoticeController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\SemesterController;
use App\Http\Middleware\BeaconAuthMiddleware;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — zslab LMS
|--------------------------------------------------------------------------
*/

Route::get('/healthz', fn () => response()->json(['status' => 'ok']));

// 인증 불필요
Route::prefix('auth')->group(base_path('routes/api/auth.php'));

// 공개 카테고리 · 강좌 API
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/courses',            [CourseController::class, 'index']);
Route::get('/courses/suggest',    [CourseController::class, 'suggest']);
Route::get('/courses/{slug}',     [CourseController::class, 'show']);

// 학기 공개 API
Route::get('/semesters', [SemesterController::class, 'index']);
Route::get('/semesters/current', [SemesterController::class, 'current']);
Route::get('/semesters/{id}/offerings', [SemesterController::class, 'offerings']);

// 자격증 공개 진위확인
Route::get('/certificates/verify/{token}', [CertificateController::class, 'verify']);

// 공지사항 · FAQ 공개 API
Route::get('/notices',      [NoticeController::class, 'index']);
Route::get('/notices/{notice}', [NoticeController::class, 'show']);
Route::get('/faqs',         [FaqController::class, 'index']);

// sendBeacon 진도 heartbeat — _token query param + text/plain 파싱 지원
// BeaconAuthMiddleware에서 text/plain 파싱 + _token 인증 모두 처리 (auth:sanctum 불필요)
Route::post('/progress/heartbeat', [ProgressController::class, 'heartbeat'])
    ->middleware([BeaconAuthMiddleware::class]);

// 인증 필요
Route::middleware('auth:sanctum')->group(base_path('routes/api/protected.php'));
