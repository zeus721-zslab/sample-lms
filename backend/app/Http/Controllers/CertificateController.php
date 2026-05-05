<?php

namespace App\Http\Controllers;

use App\Models\CertificateIssue;
use App\Models\Enrollment;
use App\Services\CertificateIssueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class CertificateController extends Controller
{
    public function __construct(private CertificateIssueService $service) {}

    /**
     * GET /api/my/certificates
     * 내 자격증 목록
     */
    public function myList(Request $request): JsonResponse
    {
        $issues = CertificateIssue::where('user_id', $request->user()->id)
            ->with(['certificate:id,code,name,issuer'])
            ->orderByDesc('issued_at')
            ->get()
            ->map(fn ($i) => [
                'id'               => $i->id,
                'serial_no'        => $i->serial_no,
                'certificate_code' => $i->certificate->code,
                'certificate_name' => $i->certificate->name,
                'issuer'           => $i->certificate->issuer,
                'issued_at'        => $i->issued_at?->toDateString(),
                'expires_at'       => $i->expires_at?->toDateString(),
                'status'           => $i->status,
                'verify_token'     => $i->verify_token,
            ]);

        return response()->json($issues);
    }

    /**
     * POST /api/my/enrollments/{enrollment}/issue-certificate
     * 수강 완료 enrollment에 대해 자격증 발급 요청
     */
    public function issue(Request $request, int $enrollmentId): JsonResponse
    {
        $enrollment = Enrollment::where('user_id', $request->user()->id)
            ->with(['course', 'user'])
            ->findOrFail($enrollmentId);

        if ($enrollment->status !== 'completed') {
            return response()->json([
                'message' => '수강을 완료해야 자격증을 발급할 수 있습니다.',
                'code'    => 'NOT_COMPLETED',
            ], 422);
        }

        try {
            $issue = $this->service->issueForEnrollment($enrollment);
        } catch (\DomainException $e) {
            $code = $e->getMessage();
            $messages = [
                'CERTIFICATE_NOT_FOUND' => '이 강좌에 연결된 자격증이 없습니다.',
                'EXAM_NOT_PASSED'       => '시험에 합격해야 자격증을 발급받을 수 있습니다.',
            ];
            return response()->json([
                'message' => $messages[$code] ?? $code,
                'code'    => $code,
            ], 422);
        }

        return response()->json([
            'id'           => $issue->id,
            'serial_no'    => $issue->serial_no,
            'verify_token' => $issue->verify_token,
            'issued_at'    => $issue->issued_at?->toDateString(),
            'expires_at'   => $issue->expires_at?->toDateString(),
            'status'       => $issue->status,
        ], 201);
    }

    /**
     * GET /api/my/certificates/{id}/download
     * PDF 다운로드
     */
    public function download(Request $request, int $id): Response
    {
        $issue = CertificateIssue::where('user_id', $request->user()->id)
            ->findOrFail($id);

        // PDF 없으면 재생성
        if (! $issue->pdf_path || ! Storage::exists($issue->pdf_path)) {
            $pdfPath = $this->service->generatePdf($issue);
            $issue->update(['pdf_path' => $pdfPath]);
        }

        $content  = Storage::get($issue->pdf_path);
        $filename = 'certificate-' . $issue->serial_no . '.pdf';

        return response($content, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * GET /api/certificates/verify/{token}
     * 공개 진위확인 (인증 불필요)
     */
    public function verify(Request $request, string $token): JsonResponse
    {
        $result = $this->service->verify($token, $request->ip());
        $status = $result['valid'] ? 200 : 404;
        return response()->json($result, $status);
    }
}
