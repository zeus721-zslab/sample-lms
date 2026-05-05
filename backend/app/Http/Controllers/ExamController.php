<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\ExamAnswer;
use App\Models\ExamSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    /**
     * GET /api/courses/{courseId}/exams
     * 코스 내 published 시험 목록 + 본인 submission 상태
     */
    public function byCourse(Request $request, int $courseId): JsonResponse
    {
        $user       = $request->user();
        $enrollment = $this->findEnrollment($user->id, $courseId);

        if (!$enrollment) {
            return response()->json(['message' => '수강 중인 강좌만 조회할 수 있습니다.'], 403);
        }

        $exams = Exam::where('course_id', $courseId)
            ->where('status', 'published')
            ->withCount('questions')
            ->get();

        $submissionMap = ExamSubmission::where('user_id', $user->id)
            ->whereIn('exam_id', $exams->pluck('id'))
            ->get()
            ->keyBy('exam_id');

        $result = $exams->map(function ($exam) use ($submissionMap) {
            $sub = $submissionMap->get($exam->id);
            return [
                'id'              => $exam->id,
                'type'            => $exam->type,
                'title'           => $exam->title,
                'duration_min'    => $exam->duration_min,
                'pass_score'      => $exam->pass_score,
                'total_score'     => $exam->total_score,
                'questions_count' => $exam->questions_count,
                'start_at'        => $exam->start_at,
                'end_at'          => $exam->end_at,
                'is_open'         => $exam->isOpen(),
                'submission'      => $sub ? [
                    'id'          => $sub->id,
                    'status'      => $sub->status,
                    'total_score' => $sub->total_score,
                    'pass_yn'     => $sub->pass_yn,
                    'submitted_at'=> $sub->submitted_at,
                ] : null,
            ];
        });

        return response()->json($result);
    }

    /**
     * GET /api/exams/{id}
     * 시험 정보 + 응시 가능 여부 + 본인 submission 상태
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $exam = Exam::with('questions:id,exam_id,order_no,type,body,choices,score')
            ->findOrFail($id);

        $user       = $request->user();
        $enrollment = $this->findEnrollment($user->id, $exam->course_id);

        if (!$enrollment) {
            return response()->json(['message' => '수강 중인 강좌의 시험만 조회할 수 있습니다.'], 403);
        }

        $submission = ExamSubmission::where('exam_id', $id)
            ->where('user_id', $user->id)
            ->first();

        return response()->json([
            'exam'        => $this->examInfo($exam),
            'can_start'   => $exam->isOpen() && !$submission,
            'submission'  => $submission ? [
                'id'          => $submission->id,
                'status'      => $submission->status,
                'total_score' => $submission->total_score,
                'pass_yn'     => $submission->pass_yn,
                'started_at'  => $submission->started_at,
                'submitted_at'=> $submission->submitted_at,
            ] : null,
        ]);
    }

    /**
     * POST /api/exams/{id}/start
     * 응시 시작 → submission 생성 + 문항 반환 (정답 제외)
     */
    public function start(Request $request, int $id): JsonResponse
    {
        $exam = Exam::with('questions')->findOrFail($id);

        $user       = $request->user();
        $enrollment = $this->findEnrollment($user->id, $exam->course_id);

        if (!$enrollment) {
            return response()->json(['message' => '수강 중인 강좌의 시험만 응시할 수 있습니다.'], 403);
        }

        if (!$exam->isOpen()) {
            return response()->json(['message' => '응시 가능한 시험이 아닙니다.'], 422);
        }

        // 이미 제출/채점된 경우
        $existing = ExamSubmission::where('exam_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing && $existing->status !== 'in_progress') {
            return response()->json(['message' => '이미 응시한 시험입니다.', 'code' => 'ALREADY_SUBMITTED'], 422);
        }

        // 진행 중인 응시가 있으면 재사용, 없으면 생성
        if ($existing && $existing->status === 'in_progress') {
            $submission = $existing;
        } else {
            $submission = ExamSubmission::create([
                'exam_id'       => $exam->id,
                'user_id'       => $user->id,
                'enrollment_id' => $enrollment->id,
                'started_at'    => now(),
                'status'        => 'in_progress',
            ]);
        }

        $questions = $exam->questions;
        if ($exam->shuffle) {
            $questions = $questions->shuffle();
        }

        // correct_answer, 내부 필드 제외하고 반환
        $safeQuestions = $questions->map(fn ($q) => [
            'id'       => $q->id,
            'order_no' => $q->order_no,
            'type'     => $q->type,
            'body'     => $q->body,
            'choices'  => $q->choices,
            'score'    => $q->score,
        ]);

        return response()->json([
            'submission_id' => $submission->id,
            'started_at'    => $submission->started_at,
            'exam'          => $this->examInfo($exam),
            'questions'     => $safeQuestions,
        ]);
    }

    /**
     * POST /api/exams/{id}/submit
     * 답안 제출 + 자동 채점
     * body: { answers: [ { question_id, answer: [] } ] }
     */
    public function submit(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'answers'                => 'required|array|min:1',
            'answers.*.question_id'  => 'required|integer',
            'answers.*.answer'       => 'required|array',
        ]);

        $exam = Exam::with('questions')->findOrFail($id);

        $user       = $request->user();
        $submission = ExamSubmission::where('exam_id', $id)
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->first();

        if (!$submission) {
            return response()->json([
                'message' => '진행 중인 시험 응시가 없습니다.',
                'code'    => 'NO_ACTIVE_SUBMISSION',
            ], 422);
        }

        // 유효한 question_id 집합
        $validQIds = $exam->questions->pluck('id')->toArray();

        foreach ($request->answers as $item) {
            if (!in_array($item['question_id'], $validQIds)) {
                continue;
            }

            ExamAnswer::updateOrCreate(
                [
                    'submission_id' => $submission->id,
                    'question_id'   => $item['question_id'],
                ],
                ['answer' => $item['answer']]
            );
        }

        // 자동 채점
        $submission->load('exam');
        $submission->autoGrade();

        return response()->json([
            'submission_id' => $submission->id,
            'status'        => $submission->status,
            'total_score'   => $submission->total_score,
            'pass_score'    => $exam->pass_score,
            'pass_yn'       => $submission->pass_yn,
            'submitted_at'  => $submission->submitted_at,
        ]);
    }

    // ── helpers ─────────────────────────────────────────────────────────

    private function findEnrollment(int $userId, int $courseId): ?Enrollment
    {
        return Enrollment::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->whereIn('status', ['pending', 'studying', 'completed'])
            ->first();
    }

    private function examInfo(Exam $exam): array
    {
        return [
            'id'           => $exam->id,
            'course_id'    => $exam->course_id,
            'type'         => $exam->type,
            'title'        => $exam->title,
            'duration_min' => $exam->duration_min,
            'pass_score'   => $exam->pass_score,
            'total_score'  => $exam->total_score,
            'shuffle'      => $exam->shuffle,
            'status'       => $exam->status,
            'start_at'     => $exam->start_at,
            'end_at'       => $exam->end_at,
        ];
    }
}
