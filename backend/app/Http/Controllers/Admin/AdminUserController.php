<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    /**
     * GET /api/admin/users
     * 필터: role, status, q | 페이지네이션 20
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('roles:id,code,name')
            ->withCount('enrollments');

        if ($q = $request->query('q')) {
            $query->where(function ($qb) use ($q) {
                $qb->where('name', 'like', "%{$q}%")
                   ->orWhere('email', 'like', "%{$q}%");
            });
        }

        if ($role = $request->query('role')) {
            $query->whereHas('roles', fn ($qb) => $qb->where('code', $role));
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $users = $query->orderByDesc('created_at')->paginate(20);

        return response()->json($users);
    }

    /**
     * POST /api/admin/users
     * 관리자가 교수자·튜터 직접 등록
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone'    => ['nullable', 'string', 'max:20'],
            'roles'    => ['nullable', 'array'],
            'roles.*'  => ['string', 'exists:roles,code'],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'phone'    => $data['phone'] ?? null,
            'status'   => 'active',
        ]);

        if (!empty($data['roles'])) {
            $roleIds = Role::whereIn('code', $data['roles'])->pluck('id');
            $user->roles()->sync($roleIds);
        }

        return response()->json($user->load('roles:id,code,name'), 201);
    }

    /**
     * GET /api/admin/users/{id}
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with([
            'roles:id,code,name',
            'enrollments' => fn ($q) => $q->with('course:id,title,course_type,status')
                ->latest('enrolled_at')->limit(20),
        ])
            ->withCount('enrollments')
            ->findOrFail($id);

        return response()->json($user);
    }

    /**
     * PATCH /api/admin/users/{id}
     * name·phone·status 수정
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name'                     => ['sometimes', 'string', 'max:100'],
            'phone'                    => ['sometimes', 'nullable', 'string', 'max:20'],
            'status'                   => ['sometimes', Rule::in(['active', 'suspended', 'withdrawn'])],
            'allow_concurrent_session' => ['sometimes', 'boolean'],
        ]);

        $user->update($data);

        return response()->json($user->load('roles:id,code,name'));
    }

    /**
     * POST /api/admin/users/{id}/roles
     * body: { roles: ['student', 'tutor'] }  — sync 방식
     */
    public function syncRoles(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'roles'   => ['required', 'array'],
            'roles.*' => ['string', 'exists:roles,code'],
        ]);

        $roleIds = Role::whereIn('code', $data['roles'])->pluck('id');
        $user->roles()->sync($roleIds);

        return response()->json([
            'message' => '역할이 업데이트되었습니다.',
            'roles'   => $user->fresh()->load('roles:id,code,name')->roles,
        ]);
    }

    /**
     * POST /api/admin/users/{id}/suspend
     */
    public function suspend(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'suspended']);

        return response()->json(['message' => '계정이 정지되었습니다.', 'status' => $user->status]);
    }

    /**
     * POST /api/admin/users/{id}/activate
     */
    public function activate(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'active']);

        return response()->json(['message' => '계정이 활성화되었습니다.', 'status' => $user->status]);
    }
}
