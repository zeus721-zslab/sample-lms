<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExamQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminQuestionController extends Controller
{
    // PATCH /api/admin/questions/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $question = ExamQuestion::findOrFail($id);

        $data = $request->validate([
            'order_no'       => ['sometimes', 'integer', 'min:1'],
            'type'           => ['sometimes', Rule::in(['single', 'multiple', 'short', 'essay'])],
            'body'           => ['sometimes', 'string'],
            'choices'        => ['nullable', 'array'],
            'correct_answer' => ['nullable', 'array'],
            'score'          => ['sometimes', 'integer', 'min:0'],
        ]);

        $question->update($data);

        return response()->json($question);
    }

    // DELETE /api/admin/questions/{id}
    public function destroy(int $id): JsonResponse
    {
        $question = ExamQuestion::findOrFail($id);
        $question->delete();

        return response()->json(['message' => '삭제되었습니다.']);
    }
}
