<?php

namespace App\Http\Controllers;

use App\Models\CourseOffering;
use App\Models\Semester;
use Illuminate\Http\JsonResponse;

class SemesterController extends Controller
{
    private const TERM_ORDER = ['spring' => 1, 'summer' => 2, 'fall' => 3, 'winter' => 4];
    private const STATUS_ORDER = ['enrolling' => 1, 'active' => 2, 'planned' => 3, 'closed' => 4];

    /**
     * GET /api/semesters
     */
    public function index(): JsonResponse
    {
        $semesters = Semester::all()
            ->sortBy([
                fn ($a, $b) => ($this->STATUS_ORDER[$a->status] ?? 9) <=> ($this->STATUS_ORDER[$b->status] ?? 9),
                fn ($a, $b) => $a->year <=> $b->year,
                fn ($a, $b) => ($this->TERM_ORDER[$a->term] ?? 9) <=> ($this->TERM_ORDER[$b->term] ?? 9),
            ])
            ->values();

        return response()->json($semesters);
    }

    /**
     * GET /api/semesters/current
     * 수강신청 중인 학기 (없으면 null)
     */
    public function current(): JsonResponse
    {
        $semester = Semester::enrolling()->first();
        return response()->json($semester);
    }

    /**
     * GET /api/semesters/{id}/offerings
     * 학기별 개설 강좌 목록
     */
    public function offerings(int $id): JsonResponse
    {
        $semester = Semester::findOrFail($id);

        $offerings = CourseOffering::where('semester_id', $semester->id)
            ->with([
                'course:id,title,slug,course_type,credit_hours,thumbnail,price',
                'tutor:id,name',
            ])
            ->get()
            ->map(function (CourseOffering $o) {
                $remaining = max(0, $o->max_students - $o->current_students);
                return [
                    'id'               => $o->id,
                    'course_id'        => $o->course_id,
                    'course'           => [
                        'id'           => $o->course->id,
                        'title'        => $o->course->title,
                        'slug'         => $o->course->slug,
                        'credit_hours' => $o->course->credit_hours,
                        'thumbnail'    => $o->course->thumbnail,
                        'price'        => $o->course->price,
                    ],
                    'tutor'            => $o->tutor ? ['id' => $o->tutor->id, 'name' => $o->tutor->name] : null,
                    'max_students'     => $o->max_students,
                    'current_students' => $o->current_students,
                    'remaining'        => $remaining,
                    'status'           => $o->status,
                ];
            });

        return response()->json([
            'semester' => $semester,
            'offerings' => $offerings,
        ]);
    }
}
