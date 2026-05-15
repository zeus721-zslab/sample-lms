<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_student_login_success(): void
    {
        $student = $this->createStudent(['email' => 'student@test.com', 'password' => 'password']);

        $response = $this->postJson('/api/auth/login', [
            'email'      => 'student@test.com',
            'password'   => 'password',
            'login_type' => 'student',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.roles.0', 'student');

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_admin_login_success(): void
    {
        $this->createAdmin(['email' => 'admin@test.com', 'password' => 'password']);

        $response = $this->postJson('/api/auth/login', [
            'email'      => 'admin@test.com',
            'password'   => 'password',
            'login_type' => 'admin',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.roles.0', 'admin');
    }

    public function test_admin_account_rejected_on_student_page(): void
    {
        $this->createAdmin(['email' => 'admin@test.com', 'password' => 'password']);

        $this->postJson('/api/auth/login', [
            'email'      => 'admin@test.com',
            'password'   => 'password',
            'login_type' => 'student',
        ])->assertStatus(422);
    }

    public function test_student_account_rejected_on_admin_page(): void
    {
        $this->createStudent(['email' => 'student@test.com', 'password' => 'password']);

        $this->postJson('/api/auth/login', [
            'email'      => 'student@test.com',
            'password'   => 'password',
            'login_type' => 'admin',
        ])->assertStatus(422);
    }

    public function test_wrong_password_returns_401(): void
    {
        $this->createStudent(['email' => 'student@test.com', 'password' => 'password']);

        $this->postJson('/api/auth/login', [
            'email'    => 'student@test.com',
            'password' => 'wrongpassword',
        ])->assertStatus(401);
    }

    public function test_me_returns_user_with_token_type(): void
    {
        $student = $this->createStudent();
        $this->actingAsStudent($student);

        $response = $this->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('token_type', 'student')
            ->assertJsonPath('user.id', $student->id);
    }

    public function test_logout_deletes_token(): void
    {
        $student = $this->createStudent();
        $this->actingAsStudent($student);

        $this->postJson('/api/auth/logout')->assertOk();

        // 해당 유저의 토큰이 삭제됐는지 확인
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id'   => $student->id,
            'tokenable_type' => \App\Models\User::class,
        ]);
    }
}
