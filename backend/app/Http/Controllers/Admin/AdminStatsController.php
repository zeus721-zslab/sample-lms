<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminStatsController extends Controller
{
    /** GET /api/admin/stats/summary — KPI 카드 */
    public function summary(): JsonResponse
    {
        $totalEnrollments = DB::table('enrollments')
            ->whereIn('status', ['studying', 'completed'])
            ->count();

        $completedCount = DB::table('enrollments')
            ->where('status', 'completed')
            ->count();

        $completionRate = $totalEnrollments > 0
            ? round($completedCount / $totalEnrollments * 100, 1)
            : 0;

        return response()->json([
            'total_users'        => DB::table('users')->count(),
            'today_users'        => DB::table('users')
                ->whereDate('created_at', today())
                ->count(),
            'total_enrollments'  => $totalEnrollments,
            'completion_rate'    => $completionRate,
            'total_revenue'      => (int) DB::table('orders')
                ->where('status', 'paid')
                ->sum('amount'),
            'total_certificates' => DB::table('certificate_issues')
                ->where('status', 'active')
                ->count(),
        ]);
    }

    /** GET /api/admin/stats/enrollments?period=7|30|90 — 일별 수강신청 추이 */
    public function enrollments(Request $request): JsonResponse
    {
        $period = min((int) $request->query('period', 30), 90);
        $from   = now()->subDays($period - 1)->startOfDay();

        $rows = DB::table('enrollments')
            ->selectRaw('DATE(enrolled_at) as date, COUNT(*) as count')
            ->where('enrolled_at', '>=', $from)
            ->whereIn('status', ['studying', 'completed', 'withdrawn'])
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        // 날짜 빈 구간 0으로 채우기
        $result = [];
        for ($i = $period - 1; $i >= 0; $i--) {
            $d = now()->subDays($i)->format('Y-m-d');
            $result[] = ['date' => $d, 'count' => (int) ($rows[$d]->count ?? 0)];
        }

        return response()->json($result);
    }

    /** GET /api/admin/stats/revenue?period=7|30|90 — 일별 매출 추이 */
    public function revenue(Request $request): JsonResponse
    {
        $period = min((int) $request->query('period', 30), 90);
        $from   = now()->subDays($period - 1)->startOfDay();

        $rows = DB::table('orders')
            ->selectRaw('DATE(paid_at) as date, SUM(amount) as total')
            ->where('status', 'paid')
            ->where('paid_at', '>=', $from)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $result = [];
        for ($i = $period - 1; $i >= 0; $i--) {
            $d = now()->subDays($i)->format('Y-m-d');
            $result[] = ['date' => $d, 'total' => (int) ($rows[$d]->total ?? 0)];
        }

        return response()->json($result);
    }

    /** GET /api/admin/stats/courses/top — 인기 강좌 TOP 10 */
    public function topCourses(): JsonResponse
    {
        $rows = DB::table('courses')
            ->leftJoin('enrollments', function ($j) {
                $j->on('enrollments.course_id', '=', 'courses.id')
                  ->whereIn('enrollments.status', ['studying', 'completed']);
            })
            ->leftJoin('categories', 'categories.id', '=', 'courses.category_id')
            ->selectRaw(
                'courses.id, courses.title, courses.course_type, courses.status,
                 categories.name as category_name,
                 COUNT(enrollments.id) as enrollment_count'
            )
            ->groupBy('courses.id', 'courses.title', 'courses.course_type', 'courses.status', 'categories.name')
            ->orderByDesc('enrollment_count')
            ->limit(10)
            ->get();

        return response()->json($rows);
    }

    /** GET /api/admin/stats/semesters — 학기별 수강 현황 (학점은행) */
    public function semesters(): JsonResponse
    {
        $rows = DB::table('semesters')
            ->leftJoin('course_offerings', 'course_offerings.semester_id', '=', 'semesters.id')
            ->leftJoin('enrollments', function ($j) {
                $j->on('enrollments.offering_id', '=', 'course_offerings.id')
                  ->whereIn('enrollments.status', ['studying', 'completed', 'withdrawn']);
            })
            ->selectRaw(
                'semesters.id,
                 semesters.year,
                 semesters.term,
                 semesters.status,
                 semesters.enroll_start_at,
                 semesters.enroll_end_at,
                 COUNT(DISTINCT course_offerings.id) as offering_count,
                 COUNT(enrollments.id) as enrollment_count,
                 SUM(CASE WHEN enrollments.status = \'completed\' THEN 1 ELSE 0 END) as completed_count'
            )
            ->groupBy('semesters.id', 'semesters.year', 'semesters.term',
                      'semesters.status', 'semesters.enroll_start_at', 'semesters.enroll_end_at')
            ->orderByDesc('semesters.year')
            ->orderByDesc('semesters.term')
            ->get();

        return response()->json($rows);
    }
}
