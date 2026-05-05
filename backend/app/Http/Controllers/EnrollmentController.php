<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EnrollmentController extends Controller
{
    /**
     * POST /api/enrollments
     * body: { course_id, offering_id? }
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'course_id'   => ['required', 'integer', 'exists:courses,id'],
            'offering_id' => ['nullable', 'integer', 'exists:course_offerings,id'],
        ]);

        $user   = $request->user();
        $course = Course::published()->findOrFail($data['course_id']);

        // ── 학점은행 코스 ─────────────────────────────────
        if ($course->course_type === 'credit_bank') {
            if (empty($data['offering_id'])) {
                return response()->json([
                    'message' => '학기와 분반을 선택하세요.',
                    'code'    => 'OFFERING_REQUIRED',
                ], 422);
            }

            $offering = CourseOffering::with('semester')
                ->where('course_id', $course->id)
                ->findOrFail($data['offering_id']);

            // 학기 수강신청 기간 확인
            if ($offering->semester->status !== 'enrolling') {
                return response()->json([
                    'message' => '수강신청 기간이 아닙니다.',
                    'code'    => 'NOT_ENROLLING',
                ], 422);
            }

            // 분반 상태 확인
            if ($offering->status !== 'open') {
                return response()->json([
                    'message' => '정원이 마감된 분반입니다.',
                    'code'    => 'OFFERING_FULL',
                ], 422);
            }

            // 정원 확인
            if ($offering->current_students >= $offering->max_students) {
                return response()->json([
                    'message' => '정원 마감입니다.',
                    'code'    => 'CAPACITY_FULL',
                ], 422);
            }

            // 동일 코스·동일 학기 중복 신청 확인
            $exists = Enrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->where('offering_id', $offering->id)
                ->whereNotIn('status', ['withdrawn'])
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => '이미 신청한 강좌입니다.',
                    'code'    => 'ALREADY_ENROLLED',
                ], 422);
            }

            // 트랜잭션: enrollment 생성 + current_students 증가 (비관적 락)
            $enrollment = DB::transaction(function () use ($user, $course, $offering) {
                $locked = CourseOffering::lockForUpdate()->findOrFail($offering->id);

                if ($locked->current_students >= $locked->max_students) {
                    abort(422, json_encode([
                        'message' => '정원 마감입니다.',
                        'code'    => 'CAPACITY_FULL',
                    ]));
                }

                $newCount = $locked->current_students + 1;
                $newStatus = ($newCount >= $locked->max_students) ? 'full' : 'open';

                $locked->update([
                    'current_students' => $newCount,
                    'status'           => $newStatus,
                ]);

                return Enrollment::create([
                    'user_id'     => $user->id,
                    'course_id'   => $course->id,
                    'offering_id' => $locked->id,
                    'status'      => 'studying',
                    'enrolled_at' => now(),
                ]);
            });

            return response()->json(
                $enrollment->load([
                    'course:id,title,slug,course_type,price',
                    'offering.semester:id,year,term,status',
                ]),
                201
            );
        }

        // ── 자격증 코스 ────────────────────────────────────
        $exists = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->whereNull('offering_id')
            ->whereNotIn('status', ['withdrawn'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => '이미 신청한 강좌입니다.',
                'code'    => 'ALREADY_ENROLLED',
            ], 422);
        }

        $status = ($course->price === 0) ? 'studying' : 'pending';

        $enrollment = Enrollment::create([
            'user_id'     => $user->id,
            'course_id'   => $course->id,
            'offering_id' => null,
            'status'      => $status,
            'enrolled_at' => now(),
        ]);

        return response()->json(
            $enrollment->load('course:id,title,slug,course_type,price'),
            201
        );
    }

    /**
     * GET /api/my/enrollments
     */
    public function index(Request $request): JsonResponse
    {
        $enrollments = Enrollment::where('user_id', $request->user()->id)
            ->with([
                'course:id,title,slug,course_type,thumbnail,price,total_lessons',
                'offering:id,course_id,semester_id,max_students,current_students,status',
                'offering.semester:id,year,term,status,enroll_start_at,enroll_end_at',
            ])
            ->orderByDesc('enrolled_at')
            ->get();

        return response()->json($enrollments);
    }

    /**
     * GET /api/my/enrollments/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $enrollment = Enrollment::where('user_id', $request->user()->id)
            ->with([
                'course:id,title,slug,course_type,thumbnail,price,total_lessons',
                'course.lessons:id,course_id,chapter,order_no,title,video_url,duration_sec',
                'progresses:id,enrollment_id,lesson_id,watched_seconds,progress_pct,completed_at,updated_at',
            ])
            ->findOrFail($id);

        return response()->json($enrollment);
    }

    /**
     * POST /api/enrollments/{id}/cancel
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $enrollment = Enrollment::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'studying'])
            ->findOrFail($id);

        DB::transaction(function () use ($enrollment) {
            // 학점은행 — 정원 복원
            if ($enrollment->offering_id) {
                $offering = CourseOffering::lockForUpdate()->findOrFail($enrollment->offering_id);
                $newCount  = max(0, $offering->current_students - 1);
                $newStatus = ($offering->status === 'full' && $newCount < $offering->max_students)
                    ? 'open'
                    : $offering->status;

                $offering->update([
                    'current_students' => $newCount,
                    'status'           => $newStatus,
                ]);
            }

            $enrollment->update(['status' => 'withdrawn']);
        });

        return response()->json(['message' => '수강신청이 취소되었습니다.']);
    }

    public function destroy(Request $request, string $course): JsonResponse
    {
        return response()->json(['message' => 'Use POST /api/enrollments/{id}/cancel'], 410);
    }
}
