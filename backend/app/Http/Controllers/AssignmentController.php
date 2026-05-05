<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    /**
     * GET /api/courses/{courseId}/assignments
     * 코스 내 published 과제 목록 + 본인 제출 상태
     */
    public function byCourse(Request $request, int $courseId): JsonResponse
    {
        $user       = $request->user();
        $enrollment = $this->findEnrollment($user->id, $courseId);

        if (!$enrollment) {
            return response()->json(['message' => '수강 중인 강좌만 조회할 수 있습니다.'], 403);
        }

        $assignments = Assignment::where('course_id', $courseId)
            ->where('status', 'published')
            ->get();

        $submissionMap = AssignmentSubmission::where('user_id', $user->id)
            ->whereIn('assignment_id', $assignments->pluck('id'))
            ->get()
            ->keyBy('assignment_id');

        $result = $assignments->map(function ($a) use ($submissionMap) {
            $sub = $submissionMap->get($a->id);
            return [
                'id'          => $a->id,
                'title'       => $a->title,
                'due_at'      => $a->due_at,
                'max_score'   => $a->max_score,
                'can_submit'  => $a->status === 'published' && now()->lt($a->due_at) && !$sub,
                'submission'  => $sub ? [
                    'id'           => $sub->id,
                    'submitted_at' => $sub->submitted_at,
                    'score'        => $sub->score,
                    'graded_at'    => $sub->graded_at,
                ] : null,
            ];
        });

        return response()->json($result);
    }

    /**
     * GET /api/assignments/{id}
     * 과제 정보 + 본인 제출 상태
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $assignment = Assignment::findOrFail($id);
        $user       = $request->user();
        $enrollment = $this->findEnrollment($user->id, $assignment->course_id);

        if (!$enrollment) {
            return response()->json(['message' => '수강 중인 강좌의 과제만 조회할 수 있습니다.'], 403);
        }

        $submission = AssignmentSubmission::where('assignment_id', $id)
            ->where('user_id', $user->id)
            ->first();

        return response()->json([
            'assignment' => [
                'id'          => $assignment->id,
                'course_id'   => $assignment->course_id,
                'title'       => $assignment->title,
                'description' => $assignment->description,
                'due_at'      => $assignment->due_at,
                'max_score'   => $assignment->max_score,
                'status'      => $assignment->status,
            ],
            'can_submit' => $assignment->status === 'published'
                && now()->lt($assignment->due_at)
                && !$submission,
            'submission' => $submission ? [
                'id'           => $submission->id,
                'text'         => $submission->text,
                'submitted_at' => $submission->submitted_at,
                'score'        => $submission->score,
                'feedback'     => $submission->feedback,
                'graded_at'    => $submission->graded_at,
            ] : null,
        ]);
    }

    /**
     * POST /api/assignments/{id}/submit
     * 과제 제출
     * body: { text: "..." }
     */
    public function submit(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'text' => 'required|string|min:1',
        ]);

        $assignment = Assignment::findOrFail($id);
        $user       = $request->user();
        $enrollment = $this->findEnrollment($user->id, $assignment->course_id);

        if (!$enrollment) {
            return response()->json(['message' => '수강 중인 강좌의 과제만 제출할 수 있습니다.'], 403);
        }

        if ($assignment->status !== 'published') {
            return response()->json(['message' => '제출 가능한 과제가 아닙니다.'], 422);
        }

        if (now()->gte($assignment->due_at)) {
            return response()->json(['message' => '제출 기한이 지났습니다.', 'code' => 'PAST_DUE'], 422);
        }

        $exists = AssignmentSubmission::where('assignment_id', $id)
            ->where('user_id', $user->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => '이미 제출한 과제입니다.', 'code' => 'ALREADY_SUBMITTED'], 422);
        }

        $submission = AssignmentSubmission::create([
            'assignment_id' => $assignment->id,
            'user_id'       => $user->id,
            'enrollment_id' => $enrollment->id,
            'text'          => $request->text,
            'submitted_at'  => now(),
        ]);

        return response()->json([
            'id'           => $submission->id,
            'assignment_id'=> $submission->assignment_id,
            'submitted_at' => $submission->submitted_at,
            'message'      => '과제가 제출되었습니다.',
        ], 201);
    }

    // ── helpers ─────────────────────────────────────────────────────────

    private function findEnrollment(int $userId, int $courseId): ?Enrollment
    {
        return Enrollment::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->whereIn('status', ['pending', 'studying', 'completed'])
            ->first();
    }
}
