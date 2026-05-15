<?php

namespace Tests\Feature\Certificate;

use App\Models\Certificate;
use App\Models\CertificateIssue;
use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\ExamSubmission;
use App\Services\CertificateIssueService;
use Tests\TestCase;

class CertificateTest extends TestCase
{
    public function test_issue_fails_when_enrollment_not_completed(): void
    {
        $student    = $this->createStudent();
        $course     = \App\Models\Course::factory()->certificate()->create();
        $enrollment = Enrollment::factory()->create([
            'user_id'   => $student->id,
            'course_id' => $course->id,
            'status'    => 'studying',
        ]);

        $this->actingAsStudent($student);

        $this->postJson("/api/my/enrollments/{$enrollment->id}/issue-certificate")
            ->assertStatus(422)
            ->assertJsonPath('code', 'NOT_COMPLETED');
    }

    public function test_issue_fails_when_exam_not_passed(): void
    {
        $student    = $this->createStudent();
        $course     = \App\Models\Course::factory()->certificate()->create();
        $enrollment = Enrollment::factory()->completed()->create([
            'user_id'   => $student->id,
            'course_id' => $course->id,
        ]);

        // 자격증 + 코스 연결 (required_pass_yn=true)
        $cert = Certificate::create([
            'code'            => 'TEST-CERT-001',
            'name'            => '테스트 자격증',
            'required_pass_yn'=> true,
        ]);
        $cert->courses()->attach($course->id);

        $this->actingAsStudent($student);

        $this->postJson("/api/my/enrollments/{$enrollment->id}/issue-certificate")
            ->assertStatus(422)
            ->assertJsonPath('code', 'EXAM_NOT_PASSED');
    }

    public function test_issue_succeeds_after_passing_exam(): void
    {
        $student    = $this->createStudent();
        $course     = \App\Models\Course::factory()->certificate()->create();
        $enrollment = Enrollment::factory()->completed()->create([
            'user_id'   => $student->id,
            'course_id' => $course->id,
        ]);

        $cert = Certificate::create([
            'code'            => 'TEST-CERT-002',
            'name'            => '합격 자격증',
            'required_pass_yn'=> true,
        ]);
        $cert->courses()->attach($course->id);

        // 시험 + 합격 제출 레코드 생성
        $exam = Exam::factory()->create(['course_id' => $course->id]);
        ExamSubmission::create([
            'exam_id'       => $exam->id,
            'user_id'       => $student->id,
            'enrollment_id' => $enrollment->id,
            'started_at'    => now()->subHour(),
            'submitted_at'  => now(),
            'status'        => 'graded',
            'total_score'   => 80,
            'pass_yn'       => true,
        ]);

        // generatePdf는 외부 의존성(DomPDF/QrCode) — partial mock으로 대체
        $this->partialMock(CertificateIssueService::class, function ($mock) {
            $mock->shouldReceive('generatePdf')->andReturn('certificates/test.pdf');
        });

        $this->actingAsStudent($student);

        $this->postJson("/api/my/enrollments/{$enrollment->id}/issue-certificate")
            ->assertStatus(201)
            ->assertJsonStructure(['id', 'serial_no', 'verify_token', 'issued_at', 'status']);
    }

    public function test_verify_valid_token_returns_valid_true(): void
    {
        $student = $this->createStudent();
        $cert    = Certificate::create([
            'code' => 'VERIFY-CERT-001',
            'name' => '진위확인 테스트',
        ]);

        $issue = CertificateIssue::create([
            'user_id'        => $student->id,
            'certificate_id' => $cert->id,
            'enrollment_id'  => null,
            'serial_no'      => 'ZSLAB-2026-TEST01',
            'verify_token'   => 'abcdef1234567890abcdef1234567890',
            'issued_at'      => now(),
            'expires_at'     => now()->addYears(2),
            'status'         => 'active',
        ]);

        $this->getJson('/api/certificates/verify/' . $issue->verify_token)
            ->assertOk()
            ->assertJsonPath('valid', true);
    }

    public function test_verify_invalid_token_returns_valid_false(): void
    {
        // 존재하지 않는 토큰 → controller가 404 반환 (valid=false)
        $this->getJson('/api/certificates/verify/nonexistenttoken00000000000000000')
            ->assertStatus(404)
            ->assertJsonPath('valid', false);
    }

    public function test_my_certificate_list_requires_auth(): void
    {
        $this->getJson('/api/my/certificates')
            ->assertStatus(401);
    }
}
