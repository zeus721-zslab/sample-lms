<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Database\Seeder;

class CourseOfferingSeeder extends Seeder
{
    public function run(): void
    {
        $tutor = User::whereHas('roles', fn ($q) => $q->where('name', '튜터'))->first();

        $creditCourses = Course::where('course_type', 'credit_bank')->get();
        $spring = Semester::where('year', 2026)->where('term', 'spring')->first();
        $summer = Semester::where('year', 2026)->where('term', 'summer')->first();

        foreach ($creditCourses as $course) {
            // spring 개설 (마감)
            CourseOffering::create([
                'course_id'        => $course->id,
                'semester_id'      => $spring->id,
                'tutor_id'         => $tutor?->id,
                'max_students'     => rand(30, 50),
                'current_students' => rand(20, 30),   // 일부 수강자 있음
                'status'           => 'closed',
            ]);

            // summer 개설 (수강신청 중)
            CourseOffering::create([
                'course_id'        => $course->id,
                'semester_id'      => $summer->id,
                'tutor_id'         => $tutor?->id,
                'max_students'     => rand(30, 50),
                'current_students' => 0,
                'status'           => 'open',
            ]);
        }
    }
}
