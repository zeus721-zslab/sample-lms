<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicRecord;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAcademicRecordController extends Controller
{
    /**
     * GET /api/admin/records
     * ?semester_id=&offering_id=&page=
     */
    public function index(Request $request): JsonResponse
    {
        $query = AcademicRecord::with([
            'enrollment.user:id,name,email',
            'enrollment.course:id,title,credit_hours',
            'enrollment.offering.semester:id,year,term',
        ]);

        if ($semId = $request->integer('semester_id')) {
            $query->whereHas('enrollment.offering', fn ($q) => $q->where('semester_id', $semId));
        }
        if ($offeringId = $request->integer('offering_id')) {
            $query->whereHas('enrollment', fn ($q) => $q->where('offering_id', $offeringId));
        }

        $data = $query->paginate(30);

        return response()->json($data);
    }

    /**
     * PATCH /api/admin/records/{enrollment_id}
     * 점수 입력 → 자동 계산
     */
    public function update(Request $request, int $enrollmentId): JsonResponse
    {
        $enrollment = Enrollment::with('course:id,credit_hours')->findOrFail($enrollmentId);

        $data = $request->validate([
            'attendance_score' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'assignment_score' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'midterm_score'    => ['nullable', 'numeric', 'min:0', 'max:100'],
            'final_score'      => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        // upsert academic_record
        $record = AcademicRecord::firstOrNew(['enrollment_id' => $enrollmentId]);
        $record->fill($data);
        $record->calculateGrade();

        // 합격 시 credit_earned 설정
        if ($record->pass_yn) {
            $record->credit_earned = $enrollment->course->credit_hours ?? 0;
        } else {
            $record->credit_earned = 0;
        }

        $record->save();

        // enrollment status 갱신
        if ($record->pass_yn) {
            $enrollment->update([
                'status'       => 'completed',
                'completed_at' => now(),
            ]);
        } elseif ($record->final_grade === 'F') {
            $enrollment->update(['status' => 'failed']);
        }

        $record->load([
            'enrollment.user:id,name,email',
            'enrollment.course:id,title,credit_hours',
        ]);

        return response()->json($record);
    }
}
