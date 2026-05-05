<?php

namespace Database\Seeders;

use App\Models\Assignment;
use App\Models\Course;
use Illuminate\Database\Seeder;

class AssignmentSeeder extends Seeder
{
    public function run(): void
    {
        // 자격증 코스 3개에 과제 1개씩 생성
        $courses = Course::where('course_type', 'certificate')
            ->where('status', 'published')
            ->take(3)
            ->get();

        foreach ($courses as $course) {
            Assignment::firstOrCreate(
                ['course_id' => $course->id, 'title' => $course->title . ' - 학습 정리 과제'],
                [
                    'description' => '강의를 수강한 후 핵심 내용을 500자 이상으로 정리하여 제출하세요.',
                    'due_at'      => now()->addDays(7),
                    'max_score'   => 100,
                    'status'      => 'published',
                ]
            );
        }
    }
}
