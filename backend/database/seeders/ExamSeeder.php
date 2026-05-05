<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Exam;
use App\Models\ExamQuestion;
use Illuminate\Database\Seeder;

class ExamSeeder extends Seeder
{
    public function run(): void
    {
        // 자격증 코스 5개에 quiz 1개씩 생성
        $courses = Course::where('course_type', 'certificate')
            ->where('status', 'published')
            ->take(5)
            ->get();

        foreach ($courses as $course) {
            /** @var Exam $exam */
            $exam = Exam::firstOrCreate(
                ['course_id' => $course->id, 'type' => 'quiz'],
                [
                    'title'        => $course->title . ' - 기본 퀴즈',
                    'duration_min' => 30,
                    'pass_score'   => 60,
                    'total_score'  => 100,
                    'shuffle'      => false,
                    'status'       => 'published',
                ]
            );

            // 기존 문항이 없을 때만 생성
            if ($exam->questions()->count() > 0) {
                continue;
            }

            $questions = [
                // 1번: 단일 선택 (20점)
                [
                    'order_no'       => 1,
                    'type'           => 'single',
                    'body'           => '다음 중 ' . $course->title . '과 가장 관련 깊은 항목은?',
                    'choices'        => ['항목 A', '항목 B', '항목 C', '항목 D'],
                    'correct_answer' => ['항목 A'],
                    'score'          => 20,
                ],
                // 2번: 단일 선택 (20점)
                [
                    'order_no'       => 2,
                    'type'           => 'single',
                    'body'           => '학습 목표를 달성하기 위한 핵심 개념으로 적절한 것은?',
                    'choices'        => ['개념 1', '개념 2', '개념 3', '개념 4'],
                    'correct_answer' => ['개념 2'],
                    'score'          => 20,
                ],
                // 3번: 단일 선택 (20점)
                [
                    'order_no'       => 3,
                    'type'           => 'single',
                    'body'           => '다음 중 올바르지 않은 설명은?',
                    'choices'        => ['설명 A는 옳다', '설명 B는 옳다', '설명 C는 옳지 않다', '설명 D는 옳다'],
                    'correct_answer' => ['설명 C는 옳지 않다'],
                    'score'          => 20,
                ],
                // 4번: 복수 선택 (20점) — 2개 정답
                [
                    'order_no'       => 4,
                    'type'           => 'multiple',
                    'body'           => '다음 중 올바른 항목을 모두 고르시오. (복수 선택)',
                    'choices'        => ['항목 A', '항목 B', '항목 C', '항목 D'],
                    'correct_answer' => ['항목 A', '항목 C'],
                    'score'          => 20,
                ],
                // 5번: 단답 (20점)
                [
                    'order_no'       => 5,
                    'type'           => 'short',
                    'body'           => '빈칸에 알맞은 단어를 입력하시오: "______은(는) 학습의 기본입니다."',
                    'choices'        => null,
                    'correct_answer' => ['복습'],
                    'score'          => 20,
                ],
            ];

            foreach ($questions as $q) {
                ExamQuestion::create(array_merge(['exam_id' => $exam->id], $q));
            }
        }

        // 서술형 시험 1개 추가 (첫 번째 자격증 코스에)
        $firstCourse = Course::where('course_type', 'certificate')
            ->where('status', 'published')
            ->first();

        if ($firstCourse) {
            $essayExam = Exam::firstOrCreate(
                ['course_id' => $firstCourse->id, 'type' => 'essay'],
                [
                    'title'        => $firstCourse->title . ' - 서술형 평가',
                    'duration_min' => 60,
                    'pass_score'   => 60,
                    'total_score'  => 100,
                    'shuffle'      => false,
                    'status'       => 'published',
                ]
            );

            if ($essayExam->questions()->count() === 0) {
                ExamQuestion::create([
                    'exam_id'        => $essayExam->id,
                    'order_no'       => 1,
                    'type'           => 'essay',
                    'body'           => '학습한 내용을 바탕으로 핵심 개념 3가지를 서술하시오.',
                    'choices'        => null,
                    'correct_answer' => null,
                    'score'          => 50,
                ]);
                ExamQuestion::create([
                    'exam_id'        => $essayExam->id,
                    'order_no'       => 2,
                    'type'           => 'essay',
                    'body'           => '실무 적용 사례를 한 가지 들어 설명하시오.',
                    'choices'        => null,
                    'correct_answer' => null,
                    'score'          => 50,
                ]);
            }
        }
    }
}
