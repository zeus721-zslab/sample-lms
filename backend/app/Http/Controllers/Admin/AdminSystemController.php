<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class AdminSystemController extends Controller
{
    /**
     * GET /api/admin/system/session-policy
     * 현재 SINGLE_SESSION_ENFORCE 값 + 예외 사용자 목록 반환
     */
    public function sessionPolicyShow(): JsonResponse
    {
        $exceptions = User::where('allow_concurrent_session', true)
            ->with('roles:id,code,name')
            ->orderByDesc('updated_at')
            ->get(['id', 'name', 'email', 'status', 'allow_concurrent_session', 'updated_at']);

        return response()->json([
            'single_session_enforce' => (bool) config('lms.single_session_enforce'),
            'exceptions'             => $exceptions,
        ]);
    }

    /**
     * PATCH /api/admin/system/session-policy
     * body: { single_session_enforce: true|false }
     * .env SINGLE_SESSION_ENFORCE 값 변경 후 config:clear
     */
    public function sessionPolicyUpdate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'single_session_enforce' => ['required', 'boolean'],
        ]);

        $value = $data['single_session_enforce'] ? 'true' : 'false';

        // .env 파일의 SINGLE_SESSION_ENFORCE 값 교체
        $envPath = base_path('.env');
        $envContent = file_get_contents($envPath);

        if (str_contains($envContent, 'SINGLE_SESSION_ENFORCE=')) {
            $envContent = preg_replace(
                '/^SINGLE_SESSION_ENFORCE=.*/m',
                "SINGLE_SESSION_ENFORCE={$value}",
                $envContent
            );
        } else {
            $envContent .= "\nSINGLE_SESSION_ENFORCE={$value}\n";
        }

        file_put_contents($envPath, $envContent);

        // config 캐시 초기화 (재기동 없이 즉시 반영)
        Artisan::call('config:clear');

        return response()->json([
            'message'                => '세션 정책이 변경되었습니다.',
            'single_session_enforce' => $data['single_session_enforce'],
        ]);
    }
}
