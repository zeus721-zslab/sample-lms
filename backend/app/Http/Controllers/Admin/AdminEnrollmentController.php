<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminEnrollmentController extends Controller
{
    /**
     * GET /api/admin/enrollments
     * ?semester_id=&offering_id=&status=&user_id=&q=&page=
     */
    public function index(Request $request): JsonResponse
    {
        $query = Enrollment::with([
            'user:id,name,email',
            'course:id,title,course_type',
            'offering.semester:id,year,term',
        ]);

        if ($semId = $request->integer('semester_id')) {
            $query->whereHas('offering', fn ($q) => $q->where('semester_id', $semId));
        }
        if ($offeringId = $request->integer('offering_id')) {
            $query->where('offering_id', $offeringId);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($userId = $request->integer('user_id')) {
            $query->where('user_id', $userId);
        }
        if ($q = $request->input('q')) {
            $query->whereHas('user', fn ($uq) =>
                $uq->where('name', 'like', "%{$q}%")
                   ->orWhere('email', 'like', "%{$q}%")
            );
        }

        $data = $query->orderByDesc('enrolled_at')->paginate(20);

        return response()->json($data);
    }

    /**
     * PATCH /api/admin/enrollments/{id}
     * status 강제 변경
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $enrollment = Enrollment::findOrFail($id);

        $data = $request->validate([
            'status' => ['required', Rule::in(['pending', 'paid', 'studying', 'completed', 'failed', 'withdrawn'])],
        ]);

        $enrollment->update($data);

        return response()->json($enrollment->load(['user:id,name,email', 'course:id,title']));
    }

    /**
     * POST /api/admin/enrollments/{id}/withdraw
     * 강제 탈퇴
     */
    public function withdraw(int $id): JsonResponse
    {
        $enrollment = Enrollment::findOrFail($id);

        if ($enrollment->status === 'withdrawn') {
            return response()->json(['message' => '이미 탈퇴 처리된 수강입니다.'], 422);
        }

        $enrollment->update(['status' => 'withdrawn']);

        // 분반 현재 수강생 수 감소
        if ($enrollment->offering_id) {
            $enrollment->offering()->decrement('current_students');
        }

        return response()->json(['message' => '수강이 탈퇴 처리되었습니다.']);
    }
}
