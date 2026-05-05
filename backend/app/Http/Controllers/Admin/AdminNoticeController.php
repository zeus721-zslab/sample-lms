<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notice;
use Illuminate\Http\Request;

class AdminNoticeController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->query('q');
        $query = Notice::orderBy('is_pinned', 'desc')->orderBy('created_at', 'desc');
        if ($q) {
            $query->where(fn($sq) => $sq->where('title', 'like', "%{$q}%")->orWhere('body', 'like', "%{$q}%"));
        }
        return response()->json($query->paginate(15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category'     => 'required|string|max:50',
            'title'        => 'required|string|max:200',
            'body'         => 'required|string',
            'is_pinned'    => 'boolean',
            'published_at' => 'nullable|date',
        ]);
        $notice = Notice::create($data);
        return response()->json($notice, 201);
    }

    public function update(Request $request, Notice $notice)
    {
        $data = $request->validate([
            'category'     => 'sometimes|string|max:50',
            'title'        => 'sometimes|string|max:200',
            'body'         => 'sometimes|string',
            'is_pinned'    => 'boolean',
            'published_at' => 'nullable|date',
        ]);
        $notice->update($data);
        return response()->json($notice);
    }

    public function destroy(Notice $notice)
    {
        $notice->delete();
        return response()->json(null, 204);
    }
}
