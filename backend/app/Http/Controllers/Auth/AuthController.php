<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\SessionControlService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function __construct(private SessionControlService $sessionControl) {}

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'email'      => 'required|email|unique:users,email',
            'password'   => ['required', 'confirmed', Password::min(8)],
            'phone'      => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
            'gender'     => 'nullable|in:male,female,other',
        ]);

        $user = User::create([
            'name'       => $data['name'],
            'email'      => $data['email'],
            'password'   => $data['password'],
            'phone'      => $data['phone'] ?? null,
            'birth_date' => $data['birth_date'] ?? null,
            'gender'     => $data['gender'] ?? null,
            'status'     => 'active',
        ]);

        $studentRole = Role::where('code', 'student')->first();
        if ($studentRole) {
            $user->roles()->attach($studentRole->id);
        }

        $user->load('roles');
        $token = $user->createToken('student-session', ['role:student'])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->userResource($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'      => 'required|email',
            'password'   => 'required|string',
            'login_type' => 'nullable|in:student,admin',
        ]);

        if (!Auth::attempt(['email' => $data['email'], 'password' => $data['password']])) {
            return response()->json(['message' => '이메일 또는 비밀번호가 올바르지 않습니다.'], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        if ($user->status !== 'active') {
            Auth::logout();
            return response()->json(['message' => '비활성화된 계정입니다.'], 403);
        }

        $user->load('roles');
        $roleCodes = $user->roles->pluck('code')->toArray();
        $isAdmin   = count(array_intersect($roleCodes, ['admin', 'professor', 'tutor'])) > 0;

        // 로그인 페이지 유형 검증 (에러 메시지는 역할 노출 방지를 위해 모호하게 처리)
        $loginType = $data['login_type'] ?? null;
        if ($loginType === 'student' && $isAdmin) {
            Auth::logout();
            return response()->json(['message' => '이메일 또는 비밀번호가 올바르지 않습니다.'], 422);
        }
        if ($loginType === 'admin' && !$isAdmin) {
            Auth::logout();
            return response()->json(['message' => '이메일 또는 비밀번호가 올바르지 않습니다.'], 422);
        }

        // 단일 세션 강제 — 기존 토큰 삭제 (정책·사용자 설정에 따라)
        $this->sessionControl->enforceIfNeeded($user);

        $tokenName = $isAdmin ? 'admin-session' : 'student-session';
        $ability   = $isAdmin ? 'role:admin'    : 'role:student';
        $token     = $user->createToken($tokenName, [$ability])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->userResource($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => '로그아웃되었습니다.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user      = $request->user()->load('roles');
        $tokenType = $request->user()->tokenCan('role:admin') ? 'admin' : 'student';

        return response()->json([
            'user'       => $this->userResource($user),
            'token_type' => $tokenType,
        ]);
    }

    private function userResource(User $user): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'phone'      => $user->phone,
            'birth_date' => $user->birth_date?->toDateString(),
            'gender'     => $user->gender,
            'status'     => $user->status,
            'roles'      => $user->roles->pluck('code'),
        ];
    }
}
