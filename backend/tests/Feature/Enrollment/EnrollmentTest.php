<?php

namespace Tests\Feature\Enrollment;

use App\Models\Course;
use Tests\TestCase;

class EnrollmentTest extends TestCase
{
    public function test_certificate_course_enrollment_succeeds(): void
    {
        $student = $this->createStudent();
        $course  = Course::factory()->certificate()->create();

        $this->actingAsStudent($student);

        $response = $this->postJson('/api/enrollments', [
            'course_id' => $course->id,
        ]);

        // price=0 이므로 즉시 studying 상태
        $response->assertStatus(201)
            ->assertJsonPath('status', 'studying');
    }

    public function test_duplicate_enrollment_returns_422(): void
    {
        $student = $this->createStudent();
        $course  = Course::factory()->certificate()->create();

        $this->actingAsStudent($student);
        $this->postJson('/api/enrollments', ['course_id' => $course->id]);

        $response = $this->postJson('/api/enrollments', ['course_id' => $course->id]);

        $response->assertStatus(422)
            ->assertJsonPath('code', 'ALREADY_ENROLLED');
    }

    public function test_unauthenticated_enrollment_returns_401(): void
    {
        $course = Course::factory()->certificate()->create();

        $this->postJson('/api/enrollments', ['course_id' => $course->id])
            ->assertStatus(401);
    }

    public function test_enrollment_on_unpublished_course_fails(): void
    {
        $student = $this->createStudent();
        $course  = Course::factory()->draft()->create();

        $this->actingAsStudent($student);

        $this->postJson('/api/enrollments', ['course_id' => $course->id])
            ->assertStatus(404);
    }

    public function test_my_enrollments_list(): void
    {
        $student = $this->createStudent();
        $course  = Course::factory()->certificate()->create();

        $this->actingAsStudent($student);
        $this->postJson('/api/enrollments', ['course_id' => $course->id]);

        $response = $this->getJson('/api/my/enrollments');

        // index()는 flat array 반환
        $response->assertOk()
            ->assertJsonCount(1);
    }
}
