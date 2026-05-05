<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use Illuminate\Http\JsonResponse;

class FaqController extends Controller
{
    public function index(): JsonResponse
    {
        $faqs = Faq::where('is_published', true)
            ->orderBy('category')
            ->orderBy('order_no')
            ->get();

        // 카테고리별 그룹
        $grouped = $faqs->groupBy('category')->map(fn($items, $cat) => [
            'category' => $cat,
            'items'    => $items->values(),
        ])->values();

        return response()->json($grouped);
    }
}
