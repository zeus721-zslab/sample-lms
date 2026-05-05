<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminAssignmentController extends Controller
{
    // GET /api/admin/assignments
    public function index(Request $request): JsonResponse
    {
        $query = Assignment::with(['course:id,title'])
            ->withCount('submissions');

        if ($q = $request->query('q')) {
            $query->where('title', 'like', "%{$q}%");
        }
        if ($courseId = $request->query('course_id')) {
            $query->where('course_id', $courseId);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    // POST /api/admin/assignments
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'course_id'   => ['required', 'integer', 'exists:courses,id'],
            'title'       => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'due_at'      => ['nullable', 'date'],
            'max_score'   => ['nullable', 'integer', 'min:0'],
            'status'      => ['nullable', Rule::in(['draft', 'published', 'closed'])],
        ]);

        $assignment = Assignment::create(array_merge(['status' => 'draft'], $data));

        return response()->json($assignment->load('course:id,title'), 201);
    }

    // PATCH /api/admin/assignments/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $assignment = Assignment::findOrFail($id);

        $data = $request->validate([
            'course_id'   => ['sometimes', 'integer', 'exists:courses,id'],
            'title'       => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'due_at'      => ['nullable', 'date'],
            'max_score'   => ['nullable', 'integer', 'min:0'],
            'status'      => ['sometimes', Rule::in(['draft', 'published', 'closed'])],
        ]);

        $assignment->update($data);

        return response()->json($assignment->load('course:id,title'));
    }

    // DELETE /api/admin/assignments/{id}
    public function destroy(int $id): JsonResponse
    {
        $assignment = Assignment::withCount('submissions')->findOrFail($id);

        if ($assignment->submissions_count > 0) {
            return response()->json(['message' => '제출 기록이 있는 과제는 삭제할 수 없습니다.'], 422);
        }

        $assignment->delete();

        return response()->json(['message' => '삭제되었습니다.']);
    }

    // GET /api/admin/assignments/{id}
    public function show(int $id): JsonResponse
    {
        $assignment = Assignment::with(['course:id,title'])
            ->withCount('submissions')
            ->findOrFail($id);

        return response()->json($assignment);
    }
}
