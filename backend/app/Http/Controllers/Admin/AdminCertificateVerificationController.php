<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CertificateIssue;
use App\Models\CertificateVerification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCertificateVerificationController extends Controller
{
    // GET /api/admin/certificate-verifications
    // 발급별 진위확인 카운트 + 최근 IP
    public function index(Request $request): JsonResponse
    {
        $query = CertificateIssue::with([
                'user:id,name,email',
                'certificate:id,name,code',
            ])
            ->withCount('verifications')
            ->having('verifications_count', '>', 0);

        if ($certId = $request->query('certificate_id')) {
            $query->where('certificate_id', $certId);
        }
        if ($q = $request->query('q')) {
            $query->where('serial_no', 'like', "%{$q}%")
                  ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%"));
        }

        $issues = $query->orderByDesc('verifications_count')->paginate(20);

        // 각 발급건의 최근 진위확인 정보 추가
        $issues->getCollection()->transform(function ($issue) {
            $latest = CertificateVerification::where('issue_id', $issue->id)
                ->orderByDesc('verified_at')
                ->first(['verified_at', 'verifier_ip']);

            $issue->latest_verified_at = $latest?->verified_at;
            $issue->latest_verifier_ip = $latest?->verifier_ip;
            return $issue;
        });

        return response()->json($issues);
    }
}
