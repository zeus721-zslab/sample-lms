<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminExamController extends Controller
{
    // GET /api/admin/exams
    public function index(Request $request): JsonResponse
    {
        $query = Exam::with(['course:id,title'])
            ->withCount(['questions', 'submissions']);

        if ($q = $request->query('q')) {
            $query->where('title', 'like', "%{$q}%");
        }
        if ($courseId = $request->query('course_id')) {
            $query->where('course_id', $courseId);
        }
        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    // POST /api/admin/exams
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'course_id'    => ['required', 'integer', 'exists:courses,id'],
            'type'         => ['required', Rule::in(['quiz', 'midterm', 'final', 'essay'])],
            'title'        => ['required', 'string', 'max:200'],
            'start_at'     => ['nullable', 'date'],
            'end_at'       => ['nullable', 'date', 'after_or_equal:start_at'],
            'duration_min' => ['nullable', 'integer', 'min:1'],
            'pass_score'   => ['nullable', 'integer', 'min:0', 'max:100'],
            'total_score'  => ['nullable', 'integer', 'min:1'],
            'shuffle'      => ['boolean'],
            'status'       => ['nullable', Rule::in(['draft', 'published', 'closed'])],
        ]);

        $exam = Exam::create(array_merge(['status' => 'draft'], $data));

        return response()->json($exam->load('course:id,title'), 201);
    }

    // PATCH /api/admin/exams/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $exam = Exam::findOrFail($id);

        $data = $request->validate([
            'course_id'    => ['sometimes', 'integer', 'exists:courses,id'],
            'type'         => ['sometimes', Rule::in(['quiz', 'midterm', 'final', 'essay'])],
            'title'        => ['sometimes', 'string', 'max:200'],
            'start_at'     => ['nullable', 'date'],
            'end_at'       => ['nullable', 'date'],
            'duration_min' => ['nullable', 'integer', 'min:1'],
            'pass_score'   => ['nullable', 'integer', 'min:0'],
            'total_score'  => ['nullable', 'integer', 'min:1'],
            'shuffle'      => ['boolean'],
            'status'       => ['sometimes', Rule::in(['draft', 'published', 'closed'])],
        ]);

        $exam->update($data);

        return response()->json($exam->load('course:id,title'));
    }

    // DELETE /api/admin/exams/{id}
    public function destroy(int $id): JsonResponse
    {
        $exam = Exam::withCount('submissions')->findOrFail($id);

        if ($exam->submissions_count > 0) {
            return response()->json(['message' => '응시 기록이 있는 시험은 삭제할 수 없습니다.'], 422);
        }

        $exam->questions()->delete();
        $exam->delete();

        return response()->json(['message' => '삭제되었습니다.']);
    }

    // GET /api/admin/exams/{id}/questions
    public function questions(int $id): JsonResponse
    {
        $exam = Exam::findOrFail($id);
        $questions = $exam->questions()->get();

        return response()->json(['exam' => $exam->load('course:id,title'), 'questions' => $questions]);
    }

    // POST /api/admin/exams/{id}/questions
    public function storeQuestion(Request $request, int $id): JsonResponse
    {
        $exam = Exam::findOrFail($id);

        $data = $request->validate([
            'order_no'       => ['nullable', 'integer', 'min:1'],
            'type'           => ['required', Rule::in(['single', 'multiple', 'short', 'essay'])],
            'body'           => ['required', 'string'],
            'choices'        => ['nullable', 'array'],
            'correct_answer' => ['nullable', 'array'],
            'score'          => ['required', 'integer', 'min:0'],
        ]);

        if (!isset($data['order_no'])) {
            $data['order_no'] = $exam->questions()->max('order_no') + 1;
        }

        $question = $exam->questions()->create($data);

        return response()->json($question, 201);
    }
}
