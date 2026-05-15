<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    private const ADMIN_ROLES = ['admin', 'professor', 'tutor'];

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => '인증이 필요합니다.'], 401);
        }

        $user->loadMissing('roles');

        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                // 토큰 ability 검증
                if (in_array($role, self::ADMIN_ROLES, true)) {
                    // admin/professor/tutor 라우트: admin-session 토큰만 허용
                    if (!$user->tokenCan('role:admin')) {
                        return response()->json(['message' => '접근 권한이 없습니다.'], 403);
                    }
                } else {
                    // student 라우트: student-session 또는 admin-session 토큰 허용 (관리자도 학습자 기능 사용 가능)
                    if (!$user->tokenCan('role:student') && !$user->tokenCan('role:admin')) {
                        return response()->json(['message' => '접근 권한이 없습니다.'], 403);
                    }
                }

                return $next($request);
            }
        }

        return response()->json(['message' => '접근 권한이 없습니다.'], 403);
    }
}
