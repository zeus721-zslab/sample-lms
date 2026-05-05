<?php

use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\ProgressController;
use Illuminate\Support\Facades\Route;

// ── 인증 공통 ────────────────────────────────────────
Route::post('/auth/logout', [\App\Http\Controllers\Auth\AuthController::class, 'logout']);
Route::get('/auth/me',      [\App\Http\Controllers\Auth\AuthController::class, 'me']);

// ── 강좌 CUD (인증 필요, 읽기는 공개 라우트) ──────────
Route::apiResource('courses', \App\Http\Controllers\CourseController::class)
    ->only(['store', 'update', 'destroy']);

// ── 시험 ─────────────────────────────────────────────
Route::middleware('role:student,admin')->group(function () {
    Route::get('/courses/{courseId}/exams', [ExamController::class, 'byCourse']);
    Route::get('/exams/{id}',               [ExamController::class, 'show']);
    Route::post('/exams/{id}/start',        [ExamController::class, 'start']);
    Route::post('/exams/{id}/submit',       [ExamController::class, 'submit']);
});

// ── 과제 ─────────────────────────────────────────────
Route::middleware('role:student,admin')->group(function () {
    Route::get('/courses/{courseId}/assignments', [AssignmentController::class, 'byCourse']);
    Route::get('/assignments/{id}',              [AssignmentController::class, 'show']);
    Route::post('/assignments/{id}/submit',      [AssignmentController::class, 'submit']);
});

// ── 수강신청 ─────────────────────────────────────────
Route::middleware('role:student,admin')->group(function () {
    Route::post('/enrollments',                   [EnrollmentController::class, 'store']);
    Route::post('/enrollments/{id}/cancel',       [EnrollmentController::class, 'cancel']);
    Route::get('/my/enrollments',                 [EnrollmentController::class, 'index']);
    Route::get('/my/enrollments/{id}',            [EnrollmentController::class, 'show']);
    // heartbeat는 api.php에서 BeaconAuthMiddleware 포함으로 별도 등록
});

// ── 진도율 (구 라우트, 호환) ───────────────────────────
Route::put('/courses/{course}/lectures/{lecture}/progress',
    [ProgressController::class, 'update']);

// ── 자격증 ───────────────────────────────────────────
Route::middleware('role:student,admin')->group(function () {
    Route::get('/my/certificates',                                [CertificateController::class, 'myList']);
    Route::post('/my/enrollments/{enrollmentId}/issue-certificate', [CertificateController::class, 'issue']);
    Route::get('/my/certificates/{id}/download',                  [CertificateController::class, 'download']);
});

// ── 결제·주문 ─────────────────────────────────────────
Route::middleware('role:student,admin')->group(function () {
    Route::post('/orders',              [OrderController::class, 'store']);
    Route::get('/orders/my',           [OrderController::class, 'myList']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
});

// ── 채팅 (1:1 문의) ──────────────────────────────────
Route::middleware('role:student,admin')->prefix('chat')->group(function () {
    Route::post('/token',                 [ChatController::class, 'token']);
    Route::post('/rooms',                 [ChatController::class, 'createRoom']);
    Route::get('/rooms/{roomId}/messages',[ChatController::class, 'messages']);
    Route::get('/unread',                 [ChatController::class, 'unread']);
});

// ── 역할별 핑 라우트 (개발·헬스체크용) ──────────────────
Route::middleware('role:student')->prefix('student')->group(function () {
    Route::get('/ping', fn () => response()->json(['ok' => 'student']));
});
Route::middleware('role:tutor,admin')->prefix('tutor')->group(function () {
    Route::get('/ping', fn () => response()->json(['ok' => 'tutor']));
});
Route::middleware('role:professor,admin')->prefix('professor')->group(function () {
    Route::get('/ping', fn () => response()->json(['ok' => 'professor']));
});

// ── 관리자 API ───────────────────────────────────────
Route::middleware('role:admin')->prefix('admin')->group(base_path('routes/api/admin/routes.php'));
