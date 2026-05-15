<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * sendBeacon 호환 미들웨어
 *
 * 1. Content-Type: text/plain body → JSON 파싱 후 request에 merge
 *    (sendBeacon 기본 Content-Type이 text/plain)
 * 2. Authorization 헤더 또는 _token query param으로 사용자 인증
 *    (sendBeacon은 커스텀 헤더 불가 → URL에 _token 포함)
 * 3. student 또는 admin 역할만 허용
 */
class BeaconAuthMiddleware
{
    public function handle(Request $request, Closure $next): mixed
    {
        // 1. text/plain body → JSON merge
        $contentType = $request->header('Content-Type', '');
        if (str_contains($contentType, 'text/plain')) {
            $decoded = json_decode($request->getContent(), true);
            if (is_array($decoded)) {
                $request->merge($decoded);
            }
        }

        // 2. Bearer 토큰 추출 (Authorization 헤더 우선, 없으면 _token query param)
        $rawToken = $request->bearerToken() ?? $request->query('_token');

        if (!$rawToken) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $tokenModel = PersonalAccessToken::findToken($rawToken);
        if (!$tokenModel) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = $tokenModel->tokenable;
        if (!$user instanceof User) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // 3. role:student or admin 확인
        $roles = $user->roles()->pluck('code')->toArray();
        if (!in_array('student', $roles) && !in_array('admin', $roles)) {
            return response()->json(['message' => '접근 권한이 없습니다.'], 403);
        }

        // auth guard에 사용자 주입 (컨트롤러에서 $request->user() 사용 가능)
        auth()->setUser($user);

        return $next($request);
    }
}
