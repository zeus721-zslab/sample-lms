<?php

namespace Tests;

use App\Models\Role;
use App\Models\User;
use App\Services\ElasticsearchService;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // ES가 비활성화된 경우 mock으로 교체 (CI/테스트 환경)
        if (!ElasticsearchService::isEnabled()) {
            $this->mock(ElasticsearchService::class, function ($mock) {
                $mock->shouldReceive('index')->andReturnNull();
                $mock->shouldReceive('delete')->andReturnNull();
                $mock->shouldReceive('search')->andReturn([]);
                $mock->shouldReceive('ensureIndex')->andReturnNull();
            });
        }
    }

    protected function createStudent(array $attrs = []): User
    {
        return $this->createUserWithRole('student', $attrs);
    }

    protected function createAdmin(array $attrs = []): User
    {
        return $this->createUserWithRole('admin', $attrs);
    }

    protected function createProfessor(array $attrs = []): User
    {
        return $this->createUserWithRole('professor', $attrs);
    }

    protected function createTutor(array $attrs = []): User
    {
        return $this->createUserWithRole('tutor', $attrs);
    }

    protected function actingAsStudent(User $user): static
    {
        $token = $user->createToken('student-session', ['role:student'])->plainTextToken;
        $this->withHeader('Authorization', "Bearer $token");
        return $this;
    }

    protected function actingAsAdmin(User $user): static
    {
        $token = $user->createToken('admin-session', ['role:admin'])->plainTextToken;
        $this->withHeader('Authorization', "Bearer $token");
        return $this;
    }

    private function createUserWithRole(string $roleCode, array $attrs): User
    {
        $user = User::factory()->create(array_merge(['status' => 'active'], $attrs));
        $role = Role::firstOrCreate(['code' => $roleCode], ['name' => ucfirst($roleCode)]);
        $user->roles()->attach($role->id);
        return $user;
    }
}
