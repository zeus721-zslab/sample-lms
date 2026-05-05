<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    /**
     * GET /api/courses
     * 공개 강좌 목록 (published 만 반환)
     * ?type=credit_bank|certificate  &category=slug  &q=검색어  &page=1
     */
    public function index(Request $request): JsonResponse
    {
        $query = Course::published()
            ->with(['category:id,code,name,slug', 'instructor:id,name'])
            ->select([
                'id', 'course_type', 'category_id', 'title', 'slug',
                'description', 'thumbnail', 'credit_hours', 'total_lessons',
                'price', 'instructor_id', 'mode',
            ]);

        if ($type = $request->query('type')) {
            $query->where('course_type', $type);
        }

        if ($catSlug = $request->query('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $catSlug));
        }

        if ($keyword = $request->query('q')) {
            $query->where('title', 'like', '%' . $keyword . '%');
        }

        $courses = $query->orderBy('id')->paginate(20);

        return response()->json($courses);
    }

    /**
     * GET /api/courses/{slug}
     * 단일 강좌 상세
     */
    public function show(string $slug): JsonResponse
    {
        $course = Course::published()
            ->with(['category:id,code,name,slug', 'instructor:id,name'])
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json($course);
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }

    public function destroy(string $id): JsonResponse
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }
}
