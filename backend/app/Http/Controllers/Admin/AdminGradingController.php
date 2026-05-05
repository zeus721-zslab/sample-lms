<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use App\Models\ExamSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminGradingController extends Controller
{
    // GET /api/admin/grading/exams
    // submitted/in_progress 응시 목록 (코스·시험 필터)
    public function examList(Request $request): JsonResponse
    {
        $query = ExamSubmission::with([
                'user:id,name,email',
                'exam:id,title,type,pass_score,course_id',
                'exam.course:id,title',
            ])
            ->whereIn('status', ['submitted', 'in_progress', 'graded']);

        if ($examId = $request->query('exam_id')) {
            $query->where('exam_id', $examId);
        }
        if ($courseId = $request->query('course_id')) {
            $query->whereHas('exam', fn ($q) => $q->where('course_id', $courseId));
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($q = $request->query('q')) {
            $query->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%"));
        }

        return response()->json($query->orderByDesc('submitted_at')->paginate(20));
    }

    // GET /api/admin/grading/exams/{submissionId}
    public function examShow(int $submissionId): JsonResponse
    {
        $submission = ExamSubmission::with([
                'user:id,name,email',
                'exam.questions',
                'answers.question',
            ])
            ->findOrFail($submissionId);

        return response()->json($submission);
    }

    // PATCH /api/admin/grading/exams/{submissionId}
    // 서술형 점수·피드백 입력 → total_score 재계산 → status=graded
    public function examGrade(Request $request, int $submissionId): JsonResponse
    {
        $submission = ExamSubmission::with(['answers.question', 'exam'])->findOrFail($submissionId);

        $data = $request->validate([
            'answers'              => ['required', 'array'],
            'answers.*.answer_id'  => ['required', 'integer'],
            'answers.*.score'      => ['required', 'integer', 'min:0'],
            'answers.*.feedback'   => ['nullable', 'string'],
        ]);

        $totalScore = 0;

        foreach ($data['answers'] as $item) {
            $answer = $submission->answers->firstWhere('id', $item['answer_id']);
            if (!$answer) continue;

            $answer->score    = $item['score'];
            if (isset($item['feedback'])) {
                $answer->graded_by = auth()->id();
                $answer->graded_at = now();
            }
            $answer->save();
        }

        // 전체 점수 재계산
        $submission->refresh()->load('answers');
        $totalScore = $submission->answers->sum('score');

        $submission->total_score = $totalScore;
        $submission->pass_yn     = $totalScore >= $submission->exam->pass_score;
        $submission->status      = 'graded';
        $submission->save();

        return response()->json($submission->load('answers.question'));
    }

    // GET /api/admin/grading/assignments
    public function assignmentList(Request $request): JsonResponse
    {
        $query = AssignmentSubmission::with([
                'user:id,name,email',
                'assignment:id,title,max_score,course_id',
                'assignment.course:id,title',
            ]);

        if ($assignmentId = $request->query('assignment_id')) {
            $query->where('assignment_id', $assignmentId);
        }
        if ($courseId = $request->query('course_id')) {
            $query->whereHas('assignment', fn ($q) => $q->where('course_id', $courseId));
        }
        if ($graded = $request->query('graded')) {
            $graded === 'false'
                ? $query->whereNull('graded_at')
                : $query->whereNotNull('graded_at');
        }
        if ($q = $request->query('q')) {
            $query->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%"));
        }

        return response()->json($query->orderByDesc('submitted_at')->paginate(20));
    }

    // GET /api/admin/grading/assignments/{submissionId}
    public function assignmentShow(int $submissionId): JsonResponse
    {
        $submission = AssignmentSubmission::with([
                'user:id,name,email',
                'assignment.course:id,title',
            ])
            ->findOrFail($submissionId);

        return response()->json($submission);
    }

    // PATCH /api/admin/grading/assignments/{submissionId}
    public function assignmentGrade(Request $request, int $submissionId): JsonResponse
    {
        $submission = AssignmentSubmission::with('assignment')->findOrFail($submissionId);

        $data = $request->validate([
            'score'    => ['required', 'integer', 'min:0'],
            'feedback' => ['nullable', 'string'],
        ]);

        $submission->update(array_merge($data, [
            'graded_by' => auth()->id(),
            'graded_at' => now(),
        ]));

        return response()->json($submission->load(['user:id,name,email', 'assignment.course:id,title']));
    }
}
