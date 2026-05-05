<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminCourseController extends Controller
{
    /**
     * GET /api/admin/courses
     * 필터: status, course_type, category_id, q
     */
    public function index(Request $request): JsonResponse
    {
        $query = Course::with(['category:id,name', 'instructor:id,name'])
            ->withCount('enrollments');

        if ($q = $request->query('q')) {
            $query->where('title', 'like', "%{$q}%");
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($type = $request->query('course_type')) {
            $query->where('course_type', $type);
        }

        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }

        $courses = $query->orderByDesc('created_at')->paginate(20);

        return response()->json($courses);
    }

    /**
     * POST /api/admin/courses
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'course_type'   => ['required', Rule::in(['certificate', 'credit_bank'])],
            'category_id'   => ['required', 'integer', 'exists:categories,id'],
            'title'         => ['required', 'string', 'max:200'],
            'slug'          => ['nullable', 'string', 'max:200', 'unique:courses,slug'],
            'description'   => ['nullable', 'string'],
            'thumbnail'     => ['nullable', 'string', 'max:500'],
            'credit_hours'  => ['nullable', 'integer', 'min:0'],
            'price'         => ['nullable', 'integer', 'min:0'],
            'instructor_id' => ['nullable', 'integer', 'exists:users,id'],
            'mode'          => ['nullable', Rule::in(['semester', 'ondemand'])],
            'status'        => ['nullable', Rule::in(['draft', 'published', 'closed'])],
        ]);

        $slug = $data['slug'] ?? Str::slug($data['title']);
        $baseSlug = $slug;
        $i = 1;
        while (Course::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $i++;
        }

        $course = Course::create([
            'course_type'   => $data['course_type'],
            'category_id'   => $data['category_id'],
            'title'         => $data['title'],
            'slug'          => $slug,
            'description'   => $data['description'] ?? '',
            'thumbnail'     => $data['thumbnail'] ?? null,
            'credit_hours'  => $data['credit_hours'] ?? 0,
            'total_lessons' => 0,
            'price'         => $data['price'] ?? 0,
            'instructor_id' => $data['instructor_id'] ?? null,
            'mode'          => $data['mode'] ?? 'ondemand',
            'status'        => $data['status'] ?? 'draft',
        ]);

        return response()->json($course->load(['category:id,name', 'instructor:id,name']), 201);
    }

    /**
     * PATCH /api/admin/courses/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $course = Course::findOrFail($id);

        $data = $request->validate([
            'category_id'   => ['sometimes', 'integer', 'exists:categories,id'],
            'title'         => ['sometimes', 'string', 'max:200'],
            'description'   => ['sometimes', 'nullable', 'string'],
            'thumbnail'     => ['sometimes', 'nullable', 'string', 'max:500'],
            'credit_hours'  => ['sometimes', 'integer', 'min:0'],
            'price'         => ['sometimes', 'integer', 'min:0'],
            'instructor_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'mode'          => ['sometimes', Rule::in(['semester', 'ondemand'])],
            'status'        => ['sometimes', Rule::in(['draft', 'published', 'closed'])],
        ]);

        $course->update($data);

        return response()->json($course->fresh()->load(['category:id,name', 'instructor:id,name']));
    }

    /**
     * GET /api/admin/courses/{id}
     */
    public function show(int $id): JsonResponse
    {
        $course = Course::with([
            'category:id,name',
            'instructor:id,name',
            'lessons' => fn ($q) => $q->orderBy('chapter')->orderBy('order_no'),
        ])
            ->withCount('enrollments')
            ->findOrFail($id);

        return response()->json($course);
    }

    /**
     * DELETE /api/admin/courses/{id}
     * 활성 수강생이 있으면 422
     */
    public function destroy(int $id): JsonResponse
    {
        $course = Course::withCount([
            'enrollments as active_enrollments_count' => fn ($q) =>
                $q->whereIn('status', ['pending', 'studying']),
        ])->findOrFail($id);

        if ($course->active_enrollments_count > 0) {
            return response()->json([
                'message' => '활성 수강생이 있어 강좌를 삭제할 수 없습니다.',
                'code'    => 'HAS_ACTIVE_ENROLLMENTS',
                'count'   => $course->active_enrollments_count,
            ], 422);
        }

        $course->delete();

        return response()->json(['message' => '강좌가 삭제되었습니다.']);
    }

    /**
     * POST /api/admin/courses/{id}/approve
     * draft → published
     */
    public function approve(int $id): JsonResponse
    {
        $course = Course::findOrFail($id);

        if ($course->status === 'published') {
            return response()->json(['message' => '이미 게시된 강좌입니다.', 'code' => 'ALREADY_PUBLISHED'], 422);
        }

        $course->update(['status' => 'published']);

        return response()->json(['message' => '강좌가 게시되었습니다.', 'status' => $course->status]);
    }

    /**
     * POST /api/admin/courses/{id}/close
     * → closed
     */
    public function close(int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $course->update(['status' => 'closed']);

        return response()->json(['message' => '강좌가 종료되었습니다.', 'status' => $course->status]);
    }
}
