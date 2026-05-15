<?php

namespace Tests\Feature\Exam;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Enrollment;
use Tests\TestCase;

class AssignmentTest extends TestCase
{
    private function setupAssignmentWithEnrollment(): array
    {
        $student    = $this->createStudent();
        $course     = Course::factory()->certificate()->create();
        $enrollment = Enrollment::factory()->create([
            'user_id'   => $student->id,
            'course_id' => $course->id,
            'status'    => 'studying',
        ]);

        $assignment = Assignment::create([
            'course_id'   => $course->id,
            'title'       => '테스트 과제',
            'description' => '과제 설명입니다.',
            'due_at'      => now()->addDays(7),
            'max_score'   => 100,
            'status'      => 'published',
        ]);

        return compact('student', 'course', 'enrollment', 'assignment');
    }

    public function test_assignment_show_returns_200(): void
    {
        ['student' => $student, 'assignment' => $assignment]
            = $this->setupAssignmentWithEnrollment();

        $this->actingAsStudent($student);

        $this->getJson("/api/assignments/{$assignment->id}")
            ->assertOk()
            ->assertJsonStructure(['assignment', 'can_submit', 'submission']);
    }

    public function test_assignment_submit_creates_submission(): void
    {
        ['student' => $student, 'assignment' => $assignment]
            = $this->setupAssignmentWithEnrollment();

        $this->actingAsStudent($student);

        $response = $this->postJson("/api/assignments/{$assignment->id}/submit", [
            'text' => '과제 답변 내용입니다.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('assignment_id', $assignment->id);

        $this->assertDatabaseHas('assignment_submissions', [
            'assignment_id' => $assignment->id,
            'user_id'       => $student->id,
        ]);
    }

    public function test_duplicate_submission_returns_422(): void
    {
        ['student' => $student, 'assignment' => $assignment]
            = $this->setupAssignmentWithEnrollment();

        $this->actingAsStudent($student);
        $this->postJson("/api/assignments/{$assignment->id}/submit", [
            'text' => '첫 번째 제출',
        ]);

        $this->postJson("/api/assignments/{$assignment->id}/submit", [
            'text' => '두 번째 제출',
        ])->assertStatus(422)
            ->assertJsonPath('code', 'ALREADY_SUBMITTED');
    }

    public function test_unauthenticated_assignment_returns_401(): void
    {
        $course     = Course::factory()->certificate()->create();
        $assignment = Assignment::create([
            'course_id' => $course->id,
            'title'     => '테스트',
            'due_at'    => now()->addDay(),
            'status'    => 'published',
        ]);

        $this->getJson("/api/assignments/{$assignment->id}")
            ->assertStatus(401);
    }

    public function test_past_due_submission_returns_422(): void
    {
        $student    = $this->createStudent();
        $course     = Course::factory()->certificate()->create();
        Enrollment::factory()->create([
            'user_id'   => $student->id,
            'course_id' => $course->id,
            'status'    => 'studying',
        ]);

        $assignment = Assignment::create([
            'course_id' => $course->id,
            'title'     => '기한 만료 과제',
            'due_at'    => now()->subDay(),
            'status'    => 'published',
        ]);

        $this->actingAsStudent($student);

        $this->postJson("/api/assignments/{$assignment->id}/submit", [
            'text' => '늦은 제출',
        ])->assertStatus(422)
            ->assertJsonPath('code', 'PAST_DUE');
    }
}
