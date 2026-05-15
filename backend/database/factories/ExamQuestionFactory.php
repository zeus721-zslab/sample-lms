<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\ExamQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExamQuestion>
 */
class ExamQuestionFactory extends Factory
{
    protected $model = ExamQuestion::class;

    public function definition(): array
    {
        return [
            'exam_id'        => Exam::factory(),
            'order_no'       => 1,
            'type'           => 'single',
            'body'           => fake()->sentence() . '?',
            'choices'        => ['1번', '2번', '3번', '4번'],
            'correct_answer' => ['1번'],
            'score'          => 20,
        ];
    }
}
