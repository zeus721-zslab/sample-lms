<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCategoryController extends Controller
{
    /**
     * GET /api/admin/categories
     * 루트 카테고리 + children 포함 트리 반환
     */
    public function index(): JsonResponse
    {
        $categories = Category::with('children')
            ->withCount('courses')
            ->whereNull('parent_id')
            ->orderBy('order_no')
            ->get();

        return response()->json($categories);
    }

    /**
     * POST /api/admin/categories
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'      => ['required', 'string', 'max:100'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'order_no'  => ['nullable', 'integer', 'min:0'],
            'code'      => ['nullable', 'string', 'max:50', 'unique:categories,code'],
        ]);

        $slug = Str::slug($data['name']);
        // slug 중복 방지
        $baseSlug = $slug;
        $i = 1;
        while (Category::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $i++;
        }

        $category = Category::create([
            'name'      => $data['name'],
            'parent_id' => $data['parent_id'] ?? null,
            'order_no'  => $data['order_no'] ?? 0,
            'code'      => $data['code'] ?? Str::upper(Str::slug($data['name'], '_')),
            'slug'      => $slug,
        ]);

        return response()->json($category->load('children'), 201);
    }

    /**
     * PATCH /api/admin/categories/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $data = $request->validate([
            'name'      => ['sometimes', 'string', 'max:100'],
            'parent_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'order_no'  => ['sometimes', 'integer', 'min:0'],
        ]);

        // 자기 자신을 부모로 지정 방지
        if (isset($data['parent_id']) && $data['parent_id'] === $id) {
            return response()->json(['message' => '자기 자신을 부모로 지정할 수 없습니다.', 'code' => 'SELF_PARENT'], 422);
        }

        $category->update($data);

        return response()->json($category->fresh()->load('children'));
    }

    /**
     * DELETE /api/admin/categories/{id}
     * 하위 카테고리 또는 강좌가 있으면 422
     */
    public function destroy(int $id): JsonResponse
    {
        $category = Category::withCount(['children', 'courses'])->findOrFail($id);

        if ($category->children_count > 0) {
            return response()->json([
                'message' => '하위 카테고리가 있어 삭제할 수 없습니다.',
                'code'    => 'HAS_CHILDREN',
            ], 422);
        }

        if ($category->courses_count > 0) {
            return response()->json([
                'message' => '해당 카테고리에 강좌가 있어 삭제할 수 없습니다.',
                'code'    => 'HAS_COURSES',
            ], 422);
        }

        $category->delete();

        return response()->json(['message' => '카테고리가 삭제되었습니다.']);
    }
}
