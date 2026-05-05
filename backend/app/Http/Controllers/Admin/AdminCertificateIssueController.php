<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CertificateIssue;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCertificateIssueController extends Controller
{
    // GET /api/admin/certificate-issues
    public function index(Request $request): JsonResponse
    {
        $query = CertificateIssue::with([
                'user:id,name,email',
                'certificate:id,name,code',
            ]);

        if ($certId = $request->query('certificate_id')) {
            $query->where('certificate_id', $certId);
        }
        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($q = $request->query('q')) {
            $query->where(function ($sub) use ($q) {
                $sub->where('serial_no', 'like', "%{$q}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%"));
            });
        }

        return response()->json($query->orderByDesc('issued_at')->paginate(20));
    }

    // POST /api/admin/certificate-issues/{id}/revoke
    public function revoke(Request $request, int $id): JsonResponse
    {
        $issue = CertificateIssue::findOrFail($id);

        if ($issue->status === 'revoked') {
            return response()->json(['message' => '이미 회수된 자격증입니다.'], 422);
        }

        $data = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $issue->update([
            'status'         => 'revoked',
            'revoked_at'     => now(),
            'revoked_reason' => $data['reason'],
        ]);

        return response()->json($issue->load(['user:id,name,email', 'certificate:id,name,code']));
    }

    // POST /api/admin/certificate-issues/manual
    // 관리자 수동 발급
    public function manual(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id'        => ['required', 'integer', 'exists:users,id'],
            'certificate_id' => ['required', 'integer', 'exists:certificates,id'],
            'enrollment_id'  => ['nullable', 'integer', 'exists:enrollments,id'],
        ]);

        // 중복 체크
        $exists = CertificateIssue::where('user_id', $data['user_id'])
            ->where('certificate_id', $data['certificate_id'])
            ->whereIn('status', ['active', 'expired'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => '이미 발급된 자격증입니다.'], 422);
        }

        $issue = CertificateIssue::create([
            'user_id'        => $data['user_id'],
            'certificate_id' => $data['certificate_id'],
            'enrollment_id'  => $data['enrollment_id'] ?? null,
            'serial_no'      => CertificateIssue::generateSerialNo(),
            'verify_token'   => CertificateIssue::generateVerifyToken(),
            'issued_at'      => now(),
            'status'         => 'active',
        ]);

        return response()->json(
            $issue->load(['user:id,name,email', 'certificate:id,name,code']),
            201
        );
    }
}
