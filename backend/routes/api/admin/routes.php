<?php

use App\Http\Controllers\Admin\AdminAcademicRecordController;
use App\Http\Controllers\Admin\AdminStatsController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminSystemController;
use App\Http\Controllers\Admin\AdminFaqController;
use App\Http\Controllers\Admin\AdminInquiryController;
use App\Http\Controllers\Admin\AdminNoticeController;
use App\Http\Controllers\Admin\AdminAssignmentController;
use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminCertificateIssueController;
use App\Http\Controllers\Admin\AdminCertificateMasterController;
use App\Http\Controllers\Admin\AdminCertificateVerificationController;
use App\Http\Controllers\Admin\AdminCourseController;
use App\Http\Controllers\Admin\AdminCreditApplicationController;
use App\Http\Controllers\Admin\AdminEnrollmentController;
use App\Http\Controllers\Admin\AdminExamController;
use App\Http\Controllers\Admin\AdminGradingController;
use App\Http\Controllers\Admin\AdminLessonController;
use App\Http\Controllers\Admin\AdminOfferingController;
use App\Http\Controllers\Admin\AdminQuestionController;
use App\Http\Controllers\Admin\AdminSemesterController;
use App\Http\Controllers\Admin\AdminUserController;
use Illuminate\Support\Facades\Route;

// ── 회원 관리 ─────────────────────────────────────────
Route::get('/users',                      [AdminUserController::class, 'index']);
Route::post('/users',                     [AdminUserController::class, 'store']);
Route::get('/users/{id}',                 [AdminUserController::class, 'show']);
Route::patch('/users/{id}',              [AdminUserController::class, 'update']);
Route::post('/users/{id}/roles',         [AdminUserController::class, 'syncRoles']);
Route::post('/users/{id}/suspend',       [AdminUserController::class, 'suspend']);
Route::post('/users/{id}/activate',      [AdminUserController::class, 'activate']);

// ── 카테고리 관리 ─────────────────────────────────────
Route::get('/categories',                [AdminCategoryController::class, 'index']);
Route::post('/categories',               [AdminCategoryController::class, 'store']);
Route::patch('/categories/{id}',        [AdminCategoryController::class, 'update']);
Route::delete('/categories/{id}',       [AdminCategoryController::class, 'destroy']);

// ── 강의 관리 ─────────────────────────────────────────
Route::get('/courses',                   [AdminCourseController::class, 'index']);
Route::post('/courses',                  [AdminCourseController::class, 'store']);
Route::get('/courses/{id}',              [AdminCourseController::class, 'show']);
Route::patch('/courses/{id}',           [AdminCourseController::class, 'update']);
Route::delete('/courses/{id}',          [AdminCourseController::class, 'destroy']);
Route::post('/courses/{id}/approve',    [AdminCourseController::class, 'approve']);
Route::post('/courses/{id}/close',      [AdminCourseController::class, 'close']);

// ── 차시 관리 ─────────────────────────────────────────
Route::get('/courses/{courseId}/lessons',  [AdminLessonController::class, 'index']);
Route::post('/courses/{courseId}/lessons', [AdminLessonController::class, 'store']);
Route::patch('/lessons/{id}',            [AdminLessonController::class, 'update']);
Route::delete('/lessons/{id}',           [AdminLessonController::class, 'destroy']);

// ── 학기 관리 ─────────────────────────────────────────
Route::get('/semesters',                  [AdminSemesterController::class, 'index']);
Route::post('/semesters',                 [AdminSemesterController::class, 'store']);
Route::patch('/semesters/{id}',          [AdminSemesterController::class, 'update']);
Route::post('/semesters/{id}/status',    [AdminSemesterController::class, 'changeStatus']);

// ── 분반 관리 ─────────────────────────────────────────
Route::get('/offerings',                  [AdminOfferingController::class, 'index']);
Route::post('/offerings',                 [AdminOfferingController::class, 'store']);
Route::patch('/offerings/{id}',          [AdminOfferingController::class, 'update']);
Route::delete('/offerings/{id}',         [AdminOfferingController::class, 'destroy']);

// ── 수강신청 현황 ──────────────────────────────────────
Route::get('/enrollments',                [AdminEnrollmentController::class, 'index']);
Route::patch('/enrollments/{id}',        [AdminEnrollmentController::class, 'update']);
Route::post('/enrollments/{id}/withdraw', [AdminEnrollmentController::class, 'withdraw']);

// ── 출석·성적 ──────────────────────────────────────────
Route::get('/records',                    [AdminAcademicRecordController::class, 'index']);
Route::patch('/records/{enrollment_id}', [AdminAcademicRecordController::class, 'update']);

// ── 학점인정 신청 ──────────────────────────────────────
Route::get('/credit-applications',               [AdminCreditApplicationController::class, 'index']);
Route::get('/credit-applications/export',        [AdminCreditApplicationController::class, 'export']);
Route::patch('/credit-applications/{id}/status', [AdminCreditApplicationController::class, 'changeStatus']);

// ── 시험 관리 ───────────────────────────────���──────────
Route::get('/exams',                         [AdminExamController::class, 'index']);
Route::post('/exams',                        [AdminExamController::class, 'store']);
Route::patch('/exams/{id}',                 [AdminExamController::class, 'update']);
Route::delete('/exams/{id}',                [AdminExamController::class, 'destroy']);
Route::get('/exams/{id}/questions',         [AdminExamController::class, 'questions']);
Route::post('/exams/{id}/questions',        [AdminExamController::class, 'storeQuestion']);
Route::patch('/questions/{id}',             [AdminQuestionController::class, 'update']);
Route::delete('/questions/{id}',            [AdminQuestionController::class, 'destroy']);

// ── 과제 관리 ─────────────────────────────���────────────
Route::get('/assignments',                   [AdminAssignmentController::class, 'index']);
Route::post('/assignments',                  [AdminAssignmentController::class, 'store']);
Route::get('/assignments/{id}',              [AdminAssignmentController::class, 'show']);
Route::patch('/assignments/{id}',           [AdminAssignmentController::class, 'update']);
Route::delete('/assignments/{id}',          [AdminAssignmentController::class, 'destroy']);

// ── 채점 ─────────────────────────────��─────────────────
Route::get('/grading/exams',                              [AdminGradingController::class, 'examList']);
Route::get('/grading/exams/{submissionId}',               [AdminGradingController::class, 'examShow']);
Route::patch('/grading/exams/{submissionId}',             [AdminGradingController::class, 'examGrade']);
Route::get('/grading/assignments',                        [AdminGradingController::class, 'assignmentList']);
Route::get('/grading/assignments/{submissionId}',         [AdminGradingController::class, 'assignmentShow']);
Route::patch('/grading/assignments/{submissionId}',       [AdminGradingController::class, 'assignmentGrade']);

// ── 자격증 마스터 ──────────────────────────────────────
Route::get('/certificates',                       [AdminCertificateMasterController::class, 'index']);
Route::post('/certificates',                      [AdminCertificateMasterController::class, 'store']);
Route::get('/certificates/{id}',                  [AdminCertificateMasterController::class, 'show']);
Route::patch('/certificates/{id}',               [AdminCertificateMasterController::class, 'update']);
Route::delete('/certificates/{id}',              [AdminCertificateMasterController::class, 'destroy']);
Route::post('/certificates/{id}/courses',         [AdminCertificateMasterController::class, 'syncCourses']);

// ── 자격증 발급 이력 ───────────────────────────────────
Route::get('/certificate-issues',                         [AdminCertificateIssueController::class, 'index']);
Route::post('/certificate-issues/manual',                 [AdminCertificateIssueController::class, 'manual']);
Route::post('/certificate-issues/{id}/revoke',            [AdminCertificateIssueController::class, 'revoke']);

// ── 진위확인 로그 ─────────────────────────────────────
Route::get('/certificate-verifications',                  [AdminCertificateVerificationController::class, 'index']);

// ── 공지사항 ───────────────────────────────────────────
Route::get('/notices',             [AdminNoticeController::class, 'index']);
Route::post('/notices',            [AdminNoticeController::class, 'store']);
Route::patch('/notices/{notice}',  [AdminNoticeController::class, 'update']);
Route::delete('/notices/{notice}', [AdminNoticeController::class, 'destroy']);

// ── FAQ ────────────────────────────────────────────────
Route::get('/faqs',          [AdminFaqController::class, 'index']);
Route::post('/faqs',         [AdminFaqController::class, 'store']);
Route::patch('/faqs/{faq}',  [AdminFaqController::class, 'update']);
Route::delete('/faqs/{faq}', [AdminFaqController::class, 'destroy']);

// ── 1:1 문의 (채팅) ────────────────────────────────────
Route::post('/inquiries/token',  [AdminInquiryController::class, 'token']);
Route::get('/inquiries',         [AdminInquiryController::class, 'index']);

// ── 결제·주문 ─────────────────────────────────────────
Route::get('/orders',              [AdminOrderController::class, 'index']);
Route::post('/orders/{id}/refund', [AdminOrderController::class, 'refund']);

// ── 통계 대시보드 ──────────────────────────────────────
Route::get('/stats/summary',          [AdminStatsController::class, 'summary']);
Route::get('/stats/enrollments',      [AdminStatsController::class, 'enrollments']);
Route::get('/stats/revenue',          [AdminStatsController::class, 'revenue']);
Route::get('/stats/courses/top',      [AdminStatsController::class, 'topCourses']);
Route::get('/stats/semesters',        [AdminStatsController::class, 'semesters']);

// ── 시스템 설정 ────────────────────────────────────────
Route::get('/system/session-policy',   [AdminSystemController::class, 'sessionPolicyShow']);
Route::patch('/system/session-policy', [AdminSystemController::class, 'sessionPolicyUpdate']);
