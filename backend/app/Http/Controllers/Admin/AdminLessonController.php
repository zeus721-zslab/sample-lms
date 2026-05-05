<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLessonController extends Controller
{
    /**
     * GET /api/admin/courses/{courseId}/lessons
     */
    public function index(int $courseId): JsonResponse
    {
        $course = Course::findOrFail($courseId);

        $lessons = $course->lessons()
            ->orderBy('chapter')
            ->orderBy('order_no')
            ->get();

        return response()->json($lessons);
    }

    /**
     * POST /api/admin/courses/{courseId}/lessons
     * 저장 후 course.total_lessons 자동 갱신
     */
    public function store(Request $request, int $courseId): JsonResponse
    {
        $course = Course::findOrFail($courseId);

        $data = $request->validate([
            'chapter'      => ['required', 'integer', 'min:1'],
            'order_no'     => ['required', 'integer', 'min:1'],
            'title'        => ['required', 'string', 'max:200'],
            'video_url'    => ['nullable', 'string', 'max:500'],
            'duration_sec' => ['nullable', 'integer', 'min:0'],
            'materials'    => ['nullable', 'array'],
        ]);

        $lesson = $course->lessons()->create($data);

        // total_lessons 갱신
        $course->update(['total_lessons' => $course->lessons()->count()]);

        return response()->json($lesson, 201);
    }

    /**
     * PATCH /api/admin/lessons/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $lesson = Lesson::findOrFail($id);

        $data = $request->validate([
            'chapter'      => ['sometimes', 'integer', 'min:1'],
            'order_no'     => ['sometimes', 'integer', 'min:1'],
            'title'        => ['sometimes', 'string', 'max:200'],
            'video_url'    => ['sometimes', 'nullable', 'string', 'max:500'],
            'duration_sec' => ['sometimes', 'integer', 'min:0'],
            'materials'    => ['sometimes', 'nullable', 'array'],
        ]);

        $lesson->update($data);

        return response()->json($lesson->fresh());
    }

    /**
     * DELETE /api/admin/lessons/{id}
     * 삭제 후 course.total_lessons 자동 갱신
     */
    public function destroy(int $id): JsonResponse
    {
        $lesson = Lesson::findOrFail($id);
        $course = $lesson->course;

        $lesson->delete();

        // total_lessons 갱신
        $course->update(['total_lessons' => $course->lessons()->count()]);

        return response()->json(['message' => '차시가 삭제되었습니다.', 'total_lessons' => $course->total_lessons]);
    }
}
