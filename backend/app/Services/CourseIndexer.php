<?php

namespace App\Services;

use App\Models\Course;

class CourseIndexer
{
    const INDEX = 'courses';

    private ElasticsearchServiceLegacy $es;

    public function __construct(ElasticsearchServiceLegacy $es)
    {
        $this->es = $es;
    }

    public function ensureIndex(): void
    {
        $this->es->ensureIndex(self::INDEX, [
            'properties' => [
                'id'          => ['type' => 'integer'],
                'title'       => ['type' => 'text', 'analyzer' => 'korean', 'fields' => ['keyword' => ['type' => 'keyword']]],
                'description' => ['type' => 'text', 'analyzer' => 'korean'],
                'slug'        => ['type' => 'keyword'],
                'course_type' => ['type' => 'keyword'],
                'status'      => ['type' => 'keyword'],
                'category'    => ['type' => 'keyword'],
                'instructor'  => ['type' => 'text', 'analyzer' => 'korean'],
                'suggest'     => ['type' => 'completion'],
            ],
        ]);
    }

    public function indexCourse(Course $course): void
    {
        if ($course->status !== 'published') {
            $this->es->delete(self::INDEX, $course->id);
            return;
        }

        $this->es->index(self::INDEX, $course->id, $this->toDocument($course));
    }

    public function deleteCourse(int $id): void
    {
        $this->es->delete(self::INDEX, $id);
    }

    public function indexAll(): int
    {
        $this->ensureIndex();

        $courses = Course::with('category')->where('status', 'published')->get();
        foreach ($courses as $course) {
            $this->es->index(self::INDEX, $course->id, $this->toDocument($course));
        }

        return $courses->count();
    }

    private function toDocument(Course $course): array
    {
        $words = collect(explode(' ', $course->title))
            ->filter(fn($w) => mb_strlen($w) >= 2)
            ->values()
            ->all();

        return [
            'id'          => $course->id,
            'title'       => $course->title,
            'description' => $course->description,
            'slug'        => $course->slug,
            'course_type' => $course->course_type,
            'status'      => $course->status,
            'category'    => $course->category?->name,
            'instructor'  => $course->instructor?->name,
            'suggest'     => [
                'input'  => array_merge([$course->title], $words),
                'weight' => $course->total_enrollments ?? 1,
            ],
        ];
    }
}
