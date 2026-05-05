<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * GET /api/categories
     * 전체 카테고리 목록 (order_no 정렬)
     */
    public function index(): JsonResponse
    {
        $categories = Category::orderBy('order_no')
            ->select(['id', 'parent_id', 'code', 'name', 'slug', 'order_no'])
            ->get();

        return response()->json($categories);
    }
}
