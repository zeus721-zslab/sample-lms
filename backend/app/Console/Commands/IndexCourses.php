<?php

namespace App\Console\Commands;

use App\Services\CourseIndexer;
use Illuminate\Console\Command;

class IndexCourses extends Command
{
    protected $signature = 'es:index-courses';
    protected $description = 'Elasticsearch 강좌 전체 재인덱싱';

    public function handle(CourseIndexer $indexer): int
    {
        $this->info('인덱싱 시작...');
        $count = $indexer->indexAll();
        $this->info("완료: {$count}개 강좌 인덱싱됨");
        return 0;
    }
}
