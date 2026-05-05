<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Database\Seeder;

class LessonSeeder extends Seeder
{
    /**
     * 공개 테스트용 HLS 스트림 URL 목록.
     * 추후 자체 CDN·HLS 변환 연동 시 교체.
     */
    private array $testVideoUrls = [
        'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
        'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
        'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    ];

    public function run(): void
    {
        $lessonTitles = [
            '강좌 소개 및 학습 방법',
            '핵심 개념 이해 1',
            '핵심 개념 이해 2',
            '기초 실습 1',
            '기초 실습 2',
            '심화 이론',
            '심화 실습',
            '문제 풀이 및 적용',
            '실전 모의고사',
            '총정리 및 마무리',
        ];

        // 자격증 코스 5개 + 학점은행 코스 3개에 실제 URL 적용
        $testCourseIds = Course::orderBy('id')
            ->limit(8)
            ->pluck('id')
            ->toArray();

        Course::all()->each(function (Course $course) use ($lessonTitles, $testCourseIds) {
            $count    = rand(5, 10);
            $chapters = ($count >= 8) ? 3 : (($count >= 5) ? 2 : 1);
            $useTestUrl = in_array($course->id, $testCourseIds, true);

            for ($i = 0; $i < $count; $i++) {
                $chapter = (int) floor($i / ceil($count / $chapters)) + 1;
                if ($chapter > $chapters) $chapter = $chapters;

                // 실제 공개 테스트 URL 또는 플레이스홀더
                if ($useTestUrl) {
                    $videoUrl = $this->testVideoUrls[$i % count($this->testVideoUrls)];
                } else {
                    $videoUrl = null; // 영상 없음 → placeholder 표시
                }

                Lesson::create([
                    'course_id'    => $course->id,
                    'chapter'      => $chapter,
                    'order_no'     => $i + 1,
                    'title'        => "CHAPTER {$chapter} - " . $lessonTitles[$i % count($lessonTitles)],
                    'video_url'    => $videoUrl,
                    'duration_sec' => rand(600, 1800),
                    'materials'    => null,
                ]);
            }

            // total_lessons 갱신
            $course->update(['total_lessons' => $count]);
        });
    }
}
