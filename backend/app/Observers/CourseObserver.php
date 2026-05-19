<?php

namespace App\Observers;

use App\Models\Course;
use Zslab\Search\Client\ElasticsearchClient;

class CourseObserver
{
    public function __construct(private ElasticsearchClient $client) {}

    public function saved(Course $course): void
    {
        if (!$this->client->isEnabled()) return;

        $course->loadMissing('category', 'instructor');

        if ($course->status !== 'published') {
            $this->client->delete(Course::getSearchIndex(), $course->id);
            return;
        }

        $this->client->index(Course::getSearchIndex(), $course->id, $course->toSearchArray());
    }

    public function deleted(Course $course): void
    {
        if (!$this->client->isEnabled()) return;

        $this->client->delete(Course::getSearchIndex(), $course->id);
    }
}
