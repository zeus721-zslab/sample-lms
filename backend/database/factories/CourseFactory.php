<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'course_type'   => 'certificate',
            'category_id'   => Category::factory(),
            'title'         => $title,
            'slug'          => Str::slug($title) . '-' . fake()->unique()->numberBetween(100, 9999),
            'description'   => fake()->paragraph(),
            'price'         => 0,
            'total_lessons' => 0,
            'status'        => 'published',
            'mode'          => 'ondemand',
        ];
    }

    public function certificate(): static
    {
        return $this->state(fn (array $attributes) => [
            'course_type' => 'certificate',
        ]);
    }

    public function creditBank(): static
    {
        return $this->state(fn (array $attributes) => [
            'course_type'  => 'credit_bank',
            'credit_hours' => 3,
            'mode'         => 'semester',
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
        ]);
    }
}
