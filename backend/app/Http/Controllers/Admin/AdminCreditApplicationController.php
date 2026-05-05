<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CreditApplication;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class AdminCreditApplicationController extends Controller
{
    /**
     * GET /api/admin/credit-applications
     * ?status=&semester_id=&page=
     */
    public function index(Request $request): JsonResponse
    {
        $query = CreditApplication::with([
            'user:id,name,email',
            'semester:id,year,term',
        ]);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($semId = $request->integer('semester_id')) {
            $query->where('semester_id', $semId);
        }

        $data = $query->orderByDesc('applied_at')->paginate(20);

        return response()->json($data);
    }

    /**
     * PATCH /api/admin/credit-applications/{id}/status
     */
    public function changeStatus(Request $request, int $id): JsonResponse
    {
        $application = CreditApplication::findOrFail($id);

        $data = $request->validate([
            'status' => ['required', Rule::in([
                'requested', 'processing', 'submitted_to_nile', 'approved', 'rejected',
            ])],
            'note'               => ['nullable', 'string'],
            'nile_submitted_at'  => ['nullable', 'date'],
            'result_received_at' => ['nullable', 'date'],
        ]);

        // submitted_to_nile 로 변경 시 자동으로 타임스탬프 설정
        if ($data['status'] === 'submitted_to_nile' && empty($data['nile_submitted_at'])) {
            $data['nile_submitted_at'] = now();
        }
        if (in_array($data['status'], ['approved', 'rejected'], true) && empty($data['result_received_at'])) {
            $data['result_received_at'] = now();
        }

        $application->update($data);

        return response()->json($application->load(['user:id,name,email', 'semester:id,year,term']));
    }

    /**
     * GET /api/admin/credit-applications/export?semester_id=
     * NILE 양식 CSV 다운로드
     * 컬럼: 학번·이름·생년월일·과목명·학점·성적·이수일
     */
    public function export(Request $request): Response
    {
        $semId = $request->integer('semester_id');

        // 해당 학기에 completed된 수강 + academic_record 합격자 조회
        $query = Enrollment::with([
            'user:id,name,email,birth_date',
            'course:id,title,credit_hours',
            'academicRecord',
        ])
        ->whereHas('academicRecord', fn ($q) => $q->where('pass_yn', true))
        ->where('status', 'completed');

        if ($semId) {
            $query->whereHas('offering', fn ($q) => $q->where('semester_id', $semId));
        }

        $enrollments = $query->get();

        // BOM + CSV 생성
        $bom = "\xEF\xBB\xBF";
        $headers = ['학번(이메일)', '이름', '생년월일', '과목명', '학점', '성적', '이수일'];

        $rows = $enrollments->map(function (Enrollment $e) {
            $record = $e->academicRecord;
            return [
                $e->user->email ?? '',
                $e->user->name ?? '',
                $e->user->birth_date ?? '',
                $e->course->title ?? '',
                $e->course->credit_hours ?? 0,
                $record->final_grade ?? '',
                $e->completed_at?->format('Y-m-d') ?? '',
            ];
        });

        $csv = $bom . implode(',', array_map(fn ($h) => "\"{$h}\"", $headers)) . "\n";
        foreach ($rows as $row) {
            $csv .= implode(',', array_map(fn ($v) => '"' . str_replace('"', '""', (string) $v) . '"', $row)) . "\n";
        }

        $filename = 'nile_export_' . ($semId ?: 'all') . '_' . now()->format('Ymd') . '.csv';

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
