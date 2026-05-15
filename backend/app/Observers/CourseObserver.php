<?php

namespace App\Observers;

use App\Models\Course;
use App\Services\CourseIndexer;
use App\Services\ElasticsearchService;

class CourseObserver
{
    public function __construct(private CourseIndexer $indexer) {}

    public function saved(Course $course): void
    {
        if (!ElasticsearchService::isEnabled()) {
            return;
        }

        $this->indexer->indexCourse($course->load('category'));
    }

    public function deleted(Course $course): void
    {
        if (!ElasticsearchService::isEnabled()) {
            return;
        }

        $this->indexer->deleteCourse($course->id);
    }
}
