<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SessionControlService
{
    /**
     * 로그인 직전 호출 — 필요 시 기존 토큰 전부 삭제 + 실시간 force_logout 전파.
     *
     * 3단 계층:
     *   1. SINGLE_SESSION_ENFORCE=false  → 무조건 허용 (아무것도 안 함)
     *   2. user.allow_concurrent_session → 허용 (아무것도 안 함)
     *   3. 그 외 → 기존 토큰 전부 삭제 + chat socket으로 force_logout 전파
     */
    public function enforceIfNeeded(User $user): void
    {
        if (!config('lms.single_session_enforce')) {
            return;
        }

        if ($user->allow_concurrent_session) {
            return;
        }

        // 기존 Personal Access Token 전부 삭제 (단일 세션 강제)
        $user->tokens()->delete();

        Log::info('[SessionControl] tokens deleted, dispatching force-logout', ['userId' => $user->id]);

        // 실시간 강제 로그아웃 — zslab-chat /internal/force-logout (fire-and-forget)
        $this->dispatchForceLogout($user->id);
    }

    /**
     * zslab-chat 서버에 force_logout 이벤트 요청.
     * 실패해도 로그인 자체를 막지 않음.
     */
    private function dispatchForceLogout(int $userId): void
    {
        $url    = rtrim(config('lms.chat_internal_url'), '/') . '/internal/force-logout';
        $secret = config('lms.chat_internal_secret');

        if (!$secret) {
            return; // 시크릿 미설정 시 스킵
        }

        Log::info('[SessionControl] calling force-logout', ['url' => $url, 'userId' => $userId]);

        try {
            $response = Http::timeout(3)
                ->withHeaders(['X-Internal-Secret' => $secret])
                ->post($url, ['userId' => $userId]);
            Log::info('[SessionControl] force-logout response', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('[SessionControl] force-logout dispatch failed', [
                'userId' => $userId,
                'error'  => $e->getMessage(),
            ]);
        }
    }
}
