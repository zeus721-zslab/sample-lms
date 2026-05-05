<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CourseOffering;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminOfferingController extends Controller
{
    /**
     * GET /api/admin/offerings
     * ?semester_id=&course_id=&status=&page=
     */
    public function index(Request $request): JsonResponse
    {
        $query = CourseOffering::with([
            'course:id,title,course_type,credit_hours',
            'semester:id,year,term,status',
            'tutor:id,name',
        ])->withCount('enrollments');

        if ($semId = $request->integer('semester_id')) {
            $query->where('semester_id', $semId);
        }
        if ($courseId = $request->integer('course_id')) {
            $query->where('course_id', $courseId);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $data = $query->orderByDesc('id')->paginate(20);

        return response()->json($data);
    }

    /**
     * POST /api/admin/offerings
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'course_id'    => ['required', 'exists:courses,id'],
            'semester_id'  => ['required', 'exists:semesters,id'],
            'tutor_id'     => ['nullable', 'exists:users,id'],
            'max_students' => ['required', 'integer', 'min:1'],
            'status'       => ['nullable', Rule::in(['open', 'full', 'closed'])],
        ]);

        $offering = CourseOffering::create($data);
        $offering->load(['course:id,title', 'semester:id,year,term', 'tutor:id,name']);

        return response()->json($offering, 201);
    }

    /**
     * PATCH /api/admin/offerings/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $offering = CourseOffering::findOrFail($id);

        $data = $request->validate([
            'tutor_id'     => ['nullable', 'exists:users,id'],
            'max_students' => ['sometimes', 'integer', 'min:1'],
            'status'       => ['sometimes', Rule::in(['open', 'full', 'closed'])],
        ]);

        $offering->update($data);
        $offering->load(['course:id,title', 'semester:id,year,term', 'tutor:id,name']);

        return response()->json($offering);
    }

    /**
     * DELETE /api/admin/offerings/{id}
     * 수강생이 있으면 422
     */
    public function destroy(int $id): JsonResponse
    {
        $offering = CourseOffering::withCount('enrollments')->findOrFail($id);

        if ($offering->enrollments_count > 0) {
            return response()->json([
                'message' => "수강생이 {$offering->enrollments_count}명 있어 삭제할 수 없습니다.",
            ], 422);
        }

        $offering->delete();

        return response()->json(['message' => '분반이 삭제되었습니다.']);
    }
}
