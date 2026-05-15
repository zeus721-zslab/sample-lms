<?php

namespace Tests\Feature\Exam;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\ExamSubmission;
use Tests\TestCase;

class ExamTest extends TestCase
{
    private function setupExamWithEnrollment(): array
    {
        $student    = $this->createStudent();
        $course     = Course::factory()->certificate()->create();
        $enrollment = Enrollment::factory()->create([
            'user_id'   => $student->id,
            'course_id' => $course->id,
            'status'    => 'studying',
        ]);

        $exam = Exam::factory()->create([
            'course_id'  => $course->id,
            'pass_score' => 60,
            'total_score'=> 100,
        ]);

        $question = ExamQuestion::factory()->create([
            'exam_id'        => $exam->id,
            'type'           => 'single',
            'score'          => 100,
            'choices'        => ['정답A', '오답B', '오답C', '오답D'],
            'correct_answer' => ['정답A'],
        ]);

        return compact('student', 'course', 'enrollment', 'exam', 'question');
    }

    public function test_exam_show_returns_200(): void
    {
        ['student' => $student, 'exam' => $exam] = $this->setupExamWithEnrollment();
        $this->actingAsStudent($student);

        $this->getJson("/api/exams/{$exam->id}")
            ->assertOk()
            ->assertJsonStructure(['exam', 'can_start', 'submission']);
    }

    public function test_exam_start_creates_submission(): void
    {
        ['student' => $student, 'exam' => $exam] = $this->setupExamWithEnrollment();
        $this->actingAsStudent($student);

        $response = $this->postJson("/api/exams/{$exam->id}/start");

        $response->assertOk()
            ->assertJsonStructure(['submission_id', 'started_at', 'exam', 'questions']);

        $this->assertDatabaseHas('exam_submissions', [
            'exam_id' => $exam->id,
            'user_id' => $student->id,
            'status'  => 'in_progress',
        ]);
    }

    public function test_correct_answer_submission_yields_pass(): void
    {
        ['student' => $student, 'exam' => $exam, 'question' => $question]
            = $this->setupExamWithEnrollment();

        $this->actingAsStudent($student);
        $startRes = $this->postJson("/api/exams/{$exam->id}/start");
        $startRes->assertOk();

        $response = $this->postJson("/api/exams/{$exam->id}/submit", [
            'answers' => [
                ['question_id' => $question->id, 'answer' => ['정답A']],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('pass_yn', true)
            ->assertJsonPath('total_score', 100);
    }

    public function test_wrong_answer_submission_yields_fail(): void
    {
        ['student' => $student, 'exam' => $exam, 'question' => $question]
            = $this->setupExamWithEnrollment();

        $this->actingAsStudent($student);
        $this->postJson("/api/exams/{$exam->id}/start");

        $response = $this->postJson("/api/exams/{$exam->id}/submit", [
            'answers' => [
                ['question_id' => $question->id, 'answer' => ['오답B']],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('pass_yn', false)
            ->assertJsonPath('total_score', 0);
    }

    public function test_resubmit_returns_422_already_submitted(): void
    {
        ['student' => $student, 'exam' => $exam, 'question' => $question]
            = $this->setupExamWithEnrollment();

        $this->actingAsStudent($student);
        $this->postJson("/api/exams/{$exam->id}/start");
        $this->postJson("/api/exams/{$exam->id}/submit", [
            'answers' => [['question_id' => $question->id, 'answer' => ['정답A']]],
        ]);

        // start 재호출 시 이미 제출된 submission이므로 422
        $this->postJson("/api/exams/{$exam->id}/start")
            ->assertStatus(422)
            ->assertJsonPath('code', 'ALREADY_SUBMITTED');
    }

    public function test_unauthenticated_exam_returns_401(): void
    {
        $course = Course::factory()->certificate()->create();
        $exam   = Exam::factory()->create(['course_id' => $course->id]);

        $this->getJson("/api/exams/{$exam->id}")
            ->assertStatus(401);
    }

    public function test_exam_without_enrollment_returns_403(): void
    {
        $student = $this->createStudent();
        $course  = Course::factory()->certificate()->create();
        $exam    = Exam::factory()->create(['course_id' => $course->id]);

        $this->actingAsStudent($student);

        $this->getJson("/api/exams/{$exam->id}")
            ->assertStatus(403);
    }
}
