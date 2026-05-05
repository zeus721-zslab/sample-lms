<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;

class AdminFaqController extends Controller
{
    public function index(Request $request)
    {
        $query = Faq::orderBy('category')->orderBy('order_no');
        if ($cat = $request->query('category')) {
            $query->where('category', $cat);
        }
        return response()->json($query->paginate(50));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category'     => 'required|string|max:50',
            'question'     => 'required|string',
            'answer'       => 'required|string',
            'order_no'     => 'integer|min:0',
            'is_published' => 'boolean',
        ]);
        return response()->json(Faq::create($data), 201);
    }

    public function update(Request $request, Faq $faq)
    {
        $data = $request->validate([
            'category'     => 'sometimes|string|max:50',
            'question'     => 'sometimes|string',
            'answer'       => 'sometimes|string',
            'order_no'     => 'integer|min:0',
            'is_published' => 'boolean',
        ]);
        $faq->update($data);
        return response()->json($faq);
    }

    public function destroy(Faq $faq)
    {
        $faq->delete();
        return response()->json(null, 204);
    }
}
