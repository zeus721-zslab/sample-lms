<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Zslab\Search\Search\PaginatedResult;
use Zslab\Search\Search\SearchBuilder;
use Zslab\Search\Search\SuggestBuilder;

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
        $filters = ['status' => 'published'];
        if ($type) { $filters['course_type'] = $type; }
        if ($catSlug) {
            $cat = Category::where('slug', $catSlug)->first();
            if ($cat) { $filters['category.keyword'] = $cat->name; }
        }

        $result = app(SearchBuilder::class)
            ->index(Course::getSearchIndex())
            ->fields(Course::getSearchFields())
            ->query($keyword)
            ->filter($filters)
            ->page($page, $perPage)
            ->fallback(function () use ($keyword, $type, $catSlug, $page, $perPage) {
                $query = Course::published()
                    ->select(['id'])
                    ->where('title', 'like', '%' . $keyword . '%');
                if ($type) { $query->where('course_type', $type); }
                if ($catSlug) { $query->whereHas('category', fn ($q) => $q->where('slug', $catSlug)); }

                $paginator = $query->orderBy('id')->paginate($perPage, ['*'], 'page', $page);

                return new PaginatedResult(
                    total:       $paginator->total(),
                    currentPage: $page,
                    perPage:     $perPage,
                    data:        [],
                    ids:         array_map(fn ($c) => $c->id, $paginator->items()),
                );
            })
            ->search();

        $ids = array_map('intval', $result->ids);
        $courses = $ids
            ? Course::with(['category:id,code,name,slug', 'instructor:id,name'])
                ->select(['id', 'course_type', 'category_id', 'title', 'slug', 'description', 'thumbnail', 'credit_hours', 'total_lessons', 'price', 'instructor_id', 'mode'])
                ->whereIn('id', $ids)
                ->get()
                ->sortBy(fn ($c) => array_search($c->id, $ids))
                ->values()
            : collect();

        $from = ($page - 1) * $perPage;
        return response()->json([
            'data'         => $courses,
            'total'        => $result->total,
            'per_page'     => $perPage,
            'current_page' => $page,
            'last_page'    => $result->lastPage,
            'from'         => $from + 1,
            'to'           => min($from + $perPage, $result->total),
        ]);
    }

    /**
     * GET /api/courses/suggest?q=검색어
     * ES search_as_you_type 기반 자동완성
     */
    public function suggest(Request $request): JsonResponse
    {
        $keyword = trim((string) $request->query('q', ''));
        if ($keyword === '') {
            return response()->json([]);
        }

        $results = app(SuggestBuilder::class)
            ->index(Course::getSearchIndex())
            ->field('title_suggest')
            ->fuzzyField('title_jamo')
            ->query($keyword)
            ->size(8)
            ->suggest();

        if (!empty($results)) {
            return response()->json(array_map(fn ($s) => $s['title'] ?? '', $results));
        }

        // DB fallback (ES 비활성 또는 오류)
        return response()->json(
            Course::published()->where('title', 'like', '%' . $keyword . '%')->limit(8)->pluck('title')
        );
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
