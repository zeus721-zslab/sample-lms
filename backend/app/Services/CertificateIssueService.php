<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\CertificateIssue;
use App\Models\CertificateVerification;
use App\Models\Enrollment;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class CertificateIssueService
{
    /**
     * 수강 완료 enrollment에 연결된 자격증을 발급하거나, 이미 발급된 issue를 반환
     */
    public function issueForEnrollment(Enrollment $enrollment): CertificateIssue
    {
        $user   = $enrollment->user;
        $course = $enrollment->course;

        // 이 코스에 연결된 자격증 조회
        $certificate = Certificate::whereHas('courses', fn ($q) => $q->where('course_id', $course->id))
            ->first();

        if (! $certificate) {
            throw new \DomainException('CERTIFICATE_NOT_FOUND');
        }

        // 이미 active 발급 건 있으면 재발급 없이 반환
        $existing = CertificateIssue::where('user_id', $user->id)
            ->where('certificate_id', $certificate->id)
            ->where('status', 'active')
            ->first();

        if ($existing) {
            return $existing;
        }

        // 시험 합격 여부 확인 (required_pass_yn=true인 경우)
        if ($certificate->required_pass_yn) {
            $passed = $enrollment->course->exams()
                ->whereHas('submissions', function ($q) use ($enrollment) {
                    $q->where('user_id', $enrollment->user_id)
                      ->where('pass_yn', true);
                })
                ->exists();

            if (! $passed) {
                throw new \DomainException('EXAM_NOT_PASSED');
            }
        }

        // 발급 레코드 생성
        $issue = CertificateIssue::create([
            'user_id'        => $user->id,
            'certificate_id' => $certificate->id,
            'enrollment_id'  => $enrollment->id,
            'serial_no'      => CertificateIssue::generateSerialNo(),
            'verify_token'   => CertificateIssue::generateVerifyToken(),
            'issued_at'      => now(),
            'expires_at'     => now()->addYears(2),
            'status'         => 'active',
        ]);

        // PDF 생성 및 저장
        $pdfPath = $this->generatePdf($issue);
        $issue->update(['pdf_path' => $pdfPath]);

        return $issue;
    }

    /**
     * PDF 생성 → storage/app/certificates/{serial_no}.pdf 저장
     * @return string 상대경로 (storage/app 기준)
     */
    public function generatePdf(CertificateIssue $issue): string
    {
        $issue->load(['user', 'certificate', 'enrollment']);

        $verifyUrl = config('app.url') . '/api/certificates/verify/' . $issue->verify_token;

        // QR 코드 SVG 생성
        $qrCode = QrCode::format('svg')
            ->size(90)
            ->errorCorrection('M')
            ->generate($verifyUrl);

        $pdf = Pdf::loadView('certificates.template', [
            'issue'     => $issue,
            'verifyUrl' => $verifyUrl,
            'qrCode'    => $qrCode,
        ]);

        $pdf->setPaper('A4', 'portrait');
        $pdf->set_option('isHtml5ParserEnabled', true);
        $pdf->set_option('isRemoteEnabled', false);
        $pdf->set_option('defaultFont', 'DejaVu Sans');

        $relativePath = 'certificates/' . $issue->serial_no . '.pdf';
        Storage::put($relativePath, $pdf->output());

        return $relativePath;
    }

    /**
     * verify_token으로 진위 확인 (ip 기록)
     */
    public function verify(string $token, ?string $ip = null): array
    {
        $issue = CertificateIssue::with(['user', 'certificate'])
            ->where('verify_token', $token)
            ->first();

        if (! $issue) {
            return ['valid' => false, 'reason' => 'NOT_FOUND'];
        }

        // 확인 로그 기록
        CertificateVerification::create([
            'issue_id'    => $issue->id,
            'verifier_ip' => $ip,
            'verified_at' => now(),
        ]);

        if (! $issue->isValid()) {
            $reason = $issue->status === 'revoked' ? 'REVOKED' : 'EXPIRED';
            return [
                'valid'  => false,
                'reason' => $reason,
                'issue'  => $this->formatIssue($issue),
            ];
        }

        return [
            'valid' => true,
            'issue' => $this->formatIssue($issue),
        ];
    }

    private function formatIssue(CertificateIssue $issue): array
    {
        return [
            'serial_no'        => $issue->serial_no,
            'certificate_name' => $issue->certificate->name,
            'issuer'           => $issue->certificate->issuer,
            'recipient_name'   => $issue->user->name,
            'issued_at'        => $issue->issued_at?->toDateString(),
            'expires_at'       => $issue->expires_at?->toDateString(),
            'status'           => $issue->status,
        ];
    }
}
