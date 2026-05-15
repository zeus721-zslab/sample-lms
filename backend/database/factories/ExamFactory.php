<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Exam;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Exam>
 */
class ExamFactory extends Factory
{
    protected $model = Exam::class;

    public function definition(): array
    {
        return [
            'course_id'    => Course::factory(),
            'type'         => 'midterm',
            'title'        => fake()->sentence(4),
            'start_at'     => now()->subDay(),
            'end_at'       => now()->addDay(),
            'duration_min' => 60,
            'pass_score'   => 60,
            'total_score'  => 100,
            'shuffle'      => false,
            'status'       => 'published',
        ];
    }
}
