<?php

namespace Database\Seeders;

use App\Models\Semester;
use Illuminate\Database\Seeder;

class SemesterSeeder extends Seeder
{
    public function run(): void
    {
        // 2026 spring — 종료된 학기
        Semester::create([
            'year'           => 2026,
            'term'           => 'spring',
            'start_date'     => '2026-03-02',
            'end_date'       => '2026-06-20',
            'enroll_start_at' => '2026-02-17 09:00:00',
            'enroll_end_at'  => '2026-02-23 23:59:59',
            'class_start_at' => '2026-03-02 00:00:00',
            'class_end_at'   => '2026-06-20 23:59:59',
            'status'         => 'closed',
        ]);

        // 2026 summer — 수강신청 중
        Semester::create([
            'year'           => 2026,
            'term'           => 'summer',
            'start_date'     => '2026-06-29',
            'end_date'       => '2026-08-22',
            'enroll_start_at' => now()->subDay()->startOfDay(),
            'enroll_end_at'  => now()->addDays(7)->endOfDay(),
            'class_start_at' => '2026-06-29 00:00:00',
            'class_end_at'   => '2026-08-22 23:59:59',
            'status'         => 'enrolling',
        ]);

        // 2026 fall — 계획 단계
        Semester::create([
            'year'           => 2026,
            'term'           => 'fall',
            'start_date'     => '2026-09-01',
            'end_date'       => '2026-12-19',
            'enroll_start_at' => now()->addDays(30)->startOfDay(),
            'enroll_end_at'  => now()->addDays(37)->endOfDay(),
            'class_start_at' => '2026-09-01 00:00:00',
            'class_end_at'   => '2026-12-19 23:59:59',
            'status'         => 'planned',
        ]);
    }
}
