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
        $staffRoles = ['admin', 'professor', 'tutor'];

        $accounts = [
            ['email' => 'admin@zslab.test',     'name' => '관리자',   'role' => 'admin'],
            ['email' => 'professor@zslab.test',  'name' => '교수',     'role' => 'professor'],
            ['email' => 'tutor@zslab.test',      'name' => '튜터',     'role' => 'tutor'],
            ['email' => 'student@zslab.test',    'name' => '수강생',   'role' => 'student'],
        ];

        foreach ($accounts as $account) {
            $isStaff = in_array($account['role'], $staffRoles);

            $user = User::firstOrCreate(
                ['email' => $account['email']],
                [
                    'name'                     => $account['name'],
                    'password'                 => Hash::make('password'),
                    'status'                   => 'active',
                    'allow_concurrent_session' => $isStaff,
                ]
            );

            if (!$user->wasRecentlyCreated) {
                $user->update(['allow_concurrent_session' => $isStaff]);
            }

            $role = Role::where('code', $account['role'])->first();
            if ($role && !$user->roles->contains($role->id)) {
                $user->roles()->syncWithoutDetaching([$role->id]);
            }
        }
    }
}
