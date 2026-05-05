<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCertificateMasterController extends Controller
{
    // GET /api/admin/certificates
    public function index(Request $request): JsonResponse
    {
        $query = Certificate::withCount(['courses', 'issues']);

        if ($q = $request->query('q')) {
            $query->where('name', 'like', "%{$q}%")
                  ->orWhere('code', 'like', "%{$q}%");
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    // POST /api/admin/certificates
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code'              => ['required', 'string', 'max:50', 'unique:certificates,code'],
            'name'              => ['required', 'string', 'max:200'],
            'issuer'            => ['nullable', 'string', 'max:200'],
            'template_path'     => ['nullable', 'string', 'max:500'],
            'required_pass_yn'  => ['boolean'],
        ]);

        $cert = Certificate::create($data);

        return response()->json($cert->loadCount(['courses', 'issues']), 201);
    }

    // PATCH /api/admin/certificates/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $cert = Certificate::findOrFail($id);

        $data = $request->validate([
            'code'             => ['sometimes', 'string', 'max:50', "unique:certificates,code,{$id}"],
            'name'             => ['sometimes', 'string', 'max:200'],
            'issuer'           => ['nullable', 'string', 'max:200'],
            'template_path'    => ['nullable', 'string', 'max:500'],
            'required_pass_yn' => ['boolean'],
        ]);

        $cert->update($data);

        return response()->json($cert->loadCount(['courses', 'issues']));
    }

    // DELETE /api/admin/certificates/{id}
    public function destroy(int $id): JsonResponse
    {
        $cert = Certificate::withCount('issues')->findOrFail($id);

        if ($cert->issues_count > 0) {
            return response()->json(['message' => '발급 이력이 있는 자격증은 삭제할 수 없습니다.'], 422);
        }

        $cert->courses()->detach();
        $cert->delete();

        return response()->json(['message' => '삭제되었습니다.']);
    }

    // GET /api/admin/certificates/{id}
    public function show(int $id): JsonResponse
    {
        $cert = Certificate::with('courses:id,title,slug')
            ->withCount(['courses', 'issues'])
            ->findOrFail($id);

        return response()->json($cert);
    }

    // POST /api/admin/certificates/{id}/courses
    // body: course_ids[] — sync 다대다
    public function syncCourses(Request $request, int $id): JsonResponse
    {
        $cert = Certificate::findOrFail($id);

        $data = $request->validate([
            'course_ids'   => ['required', 'array'],
            'course_ids.*' => ['integer', 'exists:courses,id'],
        ]);

        $cert->courses()->sync($data['course_ids']);

        return response()->json($cert->load('courses:id,title,slug'));
    }
}
