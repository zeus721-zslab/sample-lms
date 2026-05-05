<?php

namespace Database\Seeders;

use App\Models\Notice;
use Illuminate\Database\Seeder;

class NoticeSeeder extends Seeder
{
    public function run(): void
    {
        $notices = [
            ['category' => 'system',    'title' => '2026년 1학기 수강신청 안내',   'is_pinned' => true,  'published_at' => now()->subDays(10)],
            ['category' => 'system',    'title' => '학습 시스템 점검 공지 (4/30)', 'is_pinned' => true,  'published_at' => now()->subDays(5)],
            ['category' => 'general',   'title' => '자격증 시험 일정 변경 안내',    'is_pinned' => false, 'published_at' => now()->subDays(8)],
            ['category' => 'general',   'title' => '2026년 학습지원 장학금 신청',   'is_pinned' => false, 'published_at' => now()->subDays(15)],
            ['category' => 'event',     'title' => '수료 축하 이벤트 안내',         'is_pinned' => false, 'published_at' => now()->subDays(3)],
            ['category' => 'event',     'title' => '봄맞이 학습 챌린지 모집',       'is_pinned' => false, 'published_at' => now()->subDays(1)],
        ];

        foreach ($notices as $n) {
            Notice::firstOrCreate(['title' => $n['title']], array_merge($n, [
                'body' => "안녕하세요. zslab LMS입니다.\n\n" . $n['title'] . " 관련 내용을 안내드립니다.\n\n자세한 사항은 관련 부서에 문의해 주시기 바랍니다.\n\n감사합니다.",
            ]));
        }
    }
}
