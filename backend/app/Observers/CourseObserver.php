<?php

namespace App\Observers;

use App\Models\Course;
use App\Services\CourseIndexer;

class CourseObserver
{
    public function __construct(private CourseIndexer $indexer) {}

    public function saved(Course $course): void
    {
        $this->indexer->indexCourse($course->load('category'));
    }

    public function deleted(Course $course): void
    {
        $this->indexer->deleteCourse($course->id);
    }
}
