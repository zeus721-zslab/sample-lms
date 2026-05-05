<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['code' => 'admin',     'name' => '관리자'],
            ['code' => 'professor', 'name' => '교수/강사'],
            ['code' => 'tutor',     'name' => '튜터'],
            ['code' => 'student',   'name' => '수강생'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['code' => $role['code']], ['name' => $role['name']]);
        }
    }
}
