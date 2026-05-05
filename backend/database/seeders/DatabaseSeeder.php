<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            CategorySeeder::class,
            CourseSeeder::class,
            LessonSeeder::class,
            SemesterSeeder::class,
            CourseOfferingSeeder::class,
            ExamSeeder::class,
            AssignmentSeeder::class,
            CertificateSeeder::class,
            NoticeSeeder::class,
            FaqSeeder::class,
        ]);
    }
}
