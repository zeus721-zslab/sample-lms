<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Progress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgressController extends Controller
{
    /**
     * POST /api/progress/heartbeat
     * body: { enrollment_id, lesson_id, watched_seconds }
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enrollment_id'  => ['required', 'integer'],
            'lesson_id'      => ['required', 'integer'],
            'watched_seconds' => ['required', 'integer', 'min:0'],
        ]);

        $user = $request->user();

        // 자신의 수강인지 확인
        $enrollment = Enrollment::where('id', $data['enrollment_id'])
            ->where('user_id', $user->id)
            ->whereIn('status', ['studying', 'paid'])
            ->firstOrFail();

        $lesson = Lesson::where('id', $data['lesson_id'])
            ->where('course_id', $enrollment->course_id)
            ->firstOrFail();

        // progress_pct 계산 (상한 100)
        $pct = $lesson->duration_sec > 0
            ? min(100, round($data['watched_seconds'] / $lesson->duration_sec * 100, 2))
            : 0;

        $completedAt = $pct >= 95 ? now() : null;

        // upsert
        $progress = Progress::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'lesson_id'     => $lesson->id,
            ],
            [
                'watched_seconds' => max(
                    $data['watched_seconds'],
                    Progress::where('enrollment_id', $enrollment->id)
                        ->where('lesson_id', $lesson->id)
                        ->value('watched_seconds') ?? 0
                ),
                'progress_pct'  => $pct,
                'completed_at'  => $completedAt
                    ?? Progress::where('enrollment_id', $enrollment->id)
                        ->where('lesson_id', $lesson->id)
                        ->value('completed_at'),
                'updated_at'    => now(),
            ]
        );

        // 모든 lesson 완료 여부 체크
        $this->checkCourseCompletion($enrollment);

        return response()->json($progress);
    }

    private function checkCourseCompletion(Enrollment $enrollment): void
    {
        $totalLessons = Lesson::where('course_id', $enrollment->course_id)->count();
        if ($totalLessons === 0) return;

        $completedLessons = Progress::where('enrollment_id', $enrollment->id)
            ->whereNotNull('completed_at')
            ->count();

        if ($completedLessons >= $totalLessons && $enrollment->status !== 'completed') {
            $enrollment->update([
                'status'       => 'completed',
                'completed_at' => now(),
            ]);
        }
    }

    // 기존 라우트 호환 (501)
    public function update(Request $request, string $course, string $lecture): JsonResponse
    {
        return response()->json(['message' => 'Use POST /api/progress/heartbeat instead'], 410);
    }
}
