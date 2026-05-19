<?php

namespace App\Console\Commands;

use App\Models\Course;
use Illuminate\Console\Command;
use Zslab\Search\Index\IndexManager;

class IndexCourses extends Command
{
    protected $signature = 'es:index-courses';
    protected $description = 'Elasticsearch 강좌 전체 재인덱싱 (nori+ngram)';

    private const MAPPING = [
        'properties' => [
            'id'            => ['type' => 'integer'],
            'title'         => ['type' => 'text', 'analyzer' => 'nori_ngram_analyzer', 'search_analyzer' => 'nori_search_analyzer', 'fields' => ['keyword' => ['type' => 'keyword']]],
            'description'   => ['type' => 'text', 'analyzer' => 'nori_ngram_analyzer', 'search_analyzer' => 'nori_search_analyzer'],
            'slug'          => ['type' => 'keyword'],
            'course_type'   => ['type' => 'keyword'],
            'status'        => ['type' => 'keyword'],
            'category'      => ['type' => 'text', 'analyzer' => 'nori_ngram_analyzer', 'search_analyzer' => 'nori_search_analyzer', 'fields' => ['keyword' => ['type' => 'keyword']]],
            'instructor'    => ['type' => 'text', 'analyzer' => 'nori_ngram_analyzer', 'search_analyzer' => 'nori_search_analyzer'],
            'title_suggest' => ['type' => 'search_as_you_type'],
        ],
    ];

    public function handle(IndexManager $indexManager): int
    {
        $this->info('재색인 시작...');

        $indexManager->reindex(
            Course::getSearchIndex(),
            self::MAPPING,
            fn () => Course::published()->with('category', 'instructor')->get()->map(fn ($c) => $c->toSearchArray())
        );

        $count = Course::published()->count();
        $this->info("완료: {$count}개 강좌 재색인됨");
        return 0;
    }
}
