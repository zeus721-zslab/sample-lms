<?php

namespace App\Http\Controllers;

use App\Models\Notice;
use Illuminate\Http\Request;

class NoticeController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->query('q');
        $category = $request->query('category');
        $perPage = min((int)($request->query('per_page', 15)), 50);

        $query = Notice::published()
            ->orderBy('is_pinned', 'desc')
            ->orderBy('published_at', 'desc');

        if ($q) {
            $query->where(function ($sq) use ($q) {
                $sq->where('title', 'like', "%{$q}%")
                   ->orWhere('body', 'like', "%{$q}%");
            });
        }

        if ($category) {
            $query->where('category', $category);
        }

        return response()->json($query->paginate($perPage));
    }

    public function show(Notice $notice)
    {
        if ($notice->published_at && $notice->published_at->isFuture()) {
            return response()->json(['message' => 'Not found'], 404);
        }
        return response()->json($notice);
    }
}
