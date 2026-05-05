<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['email' => 'admin@zslab.test',     'name' => '관리자',   'role' => 'admin'],
            ['email' => 'professor@zslab.test',  'name' => '교수',     'role' => 'professor'],
            ['email' => 'tutor@zslab.test',      'name' => '튜터',     'role' => 'tutor'],
            ['email' => 'student@zslab.test',    'name' => '수강생',   'role' => 'student'],
        ];

        foreach ($accounts as $account) {
            $user = User::firstOrCreate(
                ['email' => $account['email']],
                [
                    'name'     => $account['name'],
                    'password' => Hash::make('password'),
                    'status'   => 'active',
                ]
            );

            $role = Role::where('code', $account['role'])->first();
            if ($role && !$user->roles->contains($role->id)) {
                $user->roles()->syncWithoutDetaching([$role->id]);
            }
        }
    }
}
