<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Services\ElasticsearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    /**
     * GET /api/courses
     * 공개 강좌 목록. ?q= 있으면 ES 전문검색, 없으면 DB 쿼리.
     * ?type=credit_bank|certificate  &category=slug  &q=검색어  &page=1
     */
    public function index(Request $request): JsonResponse
    {
        $keyword = trim((string) $request->query('q', ''));
        $type    = $request->query('type', '');
        $catSlug = $request->query('category', '');
        $page    = max(1, (int) $request->query('page', 1));
        $perPage = 20;

        if ($keyword !== '') {
            return $this->esSearch($keyword, $type, $catSlug, $page, $perPage);
        }

        $query = Course::published()
            ->with(['category:id,code,name,slug', 'instructor:id,name'])
            ->select([
                'id', 'course_type', 'category_id', 'title', 'slug',
                'description', 'thumbnail', 'credit_hours', 'total_lessons',
                'price', 'instructor_id', 'mode',
            ]);

        if ($type) {
            $query->where('course_type', $type);
        }
        if ($catSlug) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $catSlug));
        }

        return response()->json($query->orderBy('id')->paginate($perPage));
    }

    private function esSearch(string $keyword, string $type, string $catSlug, int $page, int $perPage): JsonResponse
    {
        try {
            $es = app(ElasticsearchService::class);

            $filters = [['term' => ['status' => 'published']]];
            if ($type)    { $filters[] = ['term' => ['course_type' => $type]]; }
            if ($catSlug) {
                // category slug → name lookup
                $cat = \App\Models\Category::where('slug', $catSlug)->first();
                if ($cat) { $filters[] = ['term' => ['category' => $cat->name]]; }
            }

            $from = ($page - 1) * $perPage;

            $result = $es->search('courses', [
                'from' => $from,
                'size' => $perPage,
                'query' => [
                    'bool' => [
                        'must' => [
                            'multi_match' => [
                                'query'  => $keyword,
                                'fields' => ['title^3', 'description', 'category', 'instructor'],
                                'type'   => 'best_fields',
                                'fuzziness' => 'AUTO',
                            ],
                        ],
                        'filter' => $filters,
                    ],
                ],
            ]);

            $hits  = $result['hits']['hits'];
            $total = $result['hits']['total']['value'];
            $ids   = array_map(fn($h) => (int) $h['_id'], $hits);

            $courses = Course::with(['category:id,code,name,slug', 'instructor:id,name'])
                ->select(['id','course_type','category_id','title','slug','description','thumbnail','credit_hours','total_lessons','price','instructor_id','mode'])
                ->whereIn('id', $ids)
                ->get()
                ->sortBy(fn($c) => array_search($c->id, $ids))
                ->values();

            $lastPage = max(1, (int) ceil($total / $perPage));

            return response()->json([
                'data'         => $courses,
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => $lastPage,
                'from'         => $from + 1,
                'to'           => min($from + $perPage, $total),
            ]);
        } catch (\Throwable $e) {
            // ES 장애 시 DB LIKE 폴백
            $query = Course::published()
                ->with(['category:id,code,name,slug', 'instructor:id,name'])
                ->select(['id','course_type','category_id','title','slug','description','thumbnail','credit_hours','total_lessons','price','instructor_id','mode'])
                ->where('title', 'like', '%' . $keyword . '%');
            if ($type)    { $query->where('course_type', $type); }
            if ($catSlug) { $query->whereHas('category', fn($q) => $q->where('slug', $catSlug)); }

            return response()->json($query->orderBy('id')->paginate($perPage));
        }
    }

    /**
     * GET /api/courses/suggest?q=검색어
     * ES completion suggester 기반 자동완성
     */
    public function suggest(Request $request): JsonResponse
    {
        $keyword = trim((string) $request->query('q', ''));
        if ($keyword === '') {
            return response()->json([]);
        }

        try {
            $es = app(ElasticsearchService::class);
            $result = $es->search('courses', [
                'suggest' => [
                    'course_suggest' => [
                        'prefix'     => $keyword,
                        'completion' => [
                            'field' => 'suggest',
                            'size'  => 8,
                        ],
                    ],
                ],
                '_source' => false,
            ]);

            $options = $result['suggest']['course_suggest'][0]['options'] ?? [];
            $suggestions = array_map(fn($o) => $o['text'], $options);

            return response()->json($suggestions);
        } catch (\Throwable) {
            // ES 장애 시 DB LIKE 폴백
            $titles = Course::published()
                ->where('title', 'like', '%' . $keyword . '%')
                ->limit(8)
                ->pluck('title');

            return response()->json($titles);
        }
    }

    /**
     * GET /api/courses/{slug}
     * 단일 강좌 상세
     */
    public function show(string $slug): JsonResponse
    {
        $course = Course::published()
            ->with(['category:id,code,name,slug', 'instructor:id,name'])
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json($course);
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }

    public function destroy(string $id): JsonResponse
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }
}
