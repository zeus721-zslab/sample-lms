<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Semester;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Validation\Rule;

class AdminSemesterController extends Controller
{
    /**
     * GET /api/admin/semesters
     */
    public function index(): JsonResponse
    {
        $semesters = Semester::withCount('offerings')
            ->orderByDesc('year')
            ->orderByRaw("FIELD(term,'spring','summer','fall','winter')")
            ->get();

        return response()->json($semesters);
    }

    /**
     * POST /api/admin/semesters
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'year'            => ['required', 'integer', 'min:2000', 'max:2100'],
            'term'            => ['required', Rule::in(['spring', 'summer', 'fall', 'winter'])],
            'start_date'      => ['required', 'date'],
            'end_date'        => ['required', 'date', 'after_or_equal:start_date'],
            'enroll_start_at' => ['nullable', 'date'],
            'enroll_end_at'   => ['nullable', 'date'],
            'class_start_at'  => ['nullable', 'date'],
            'class_end_at'    => ['nullable', 'date'],
            'status'          => ['nullable', Rule::in(['planned', 'enrolling', 'active', 'closed'])],
        ]);

        // year+term 중복 검사
        if (Semester::where('year', $data['year'])->where('term', $data['term'])->exists()) {
            return response()->json(['message' => "{$data['year']}년 {$data['term']} 학기가 이미 존재합니다."], 422);
        }

        $semester = Semester::create($data);

        return response()->json($semester, 201);
    }

    /**
     * PATCH /api/admin/semesters/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $semester = Semester::findOrFail($id);

        $data = $request->validate([
            'year'            => ['sometimes', 'integer', 'min:2000', 'max:2100'],
            'term'            => ['sometimes', Rule::in(['spring', 'summer', 'fall', 'winter'])],
            'start_date'      => ['sometimes', 'date'],
            'end_date'        => ['sometimes', 'date'],
            'enroll_start_at' => ['nullable', 'date'],
            'enroll_end_at'   => ['nullable', 'date'],
            'class_start_at'  => ['nullable', 'date'],
            'class_end_at'    => ['nullable', 'date'],
        ]);

        $semester->update($data);

        return response()->json($semester);
    }

    /**
     * POST /api/admin/semesters/{id}/status
     * status 전환: planned→enrolling→active→closed
     */
    public function changeStatus(Request $request, int $id): JsonResponse
    {
        $semester = Semester::findOrFail($id);

        $data = $request->validate([
            'status' => ['required', Rule::in(['planned', 'enrolling', 'active', 'closed'])],
        ]);

        $transitions = [
            'planned'   => ['enrolling'],
            'enrolling' => ['active', 'planned'],
            'active'    => ['closed'],
            'closed'    => [],
        ];

        $allowed = $transitions[$semester->status] ?? [];

        if (! in_array($data['status'], $allowed, true)) {
            return response()->json([
                'message' => "'{$semester->status}' 상태에서 '{$data['status']}'(으)로 전환할 수 없습니다.",
                'allowed' => $allowed,
            ], 422);
        }

        $semester->update(['status' => $data['status']]);

        return response()->json($semester);
    }
}
