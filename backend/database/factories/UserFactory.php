<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name'                    => fake()->name(),
            'email'                   => fake()->unique()->safeEmail(),
            'email_verified_at'       => now(),
            'password'                => static::$password ??= Hash::make('password'),
            'remember_token'          => Str::random(10),
            'status'                  => 'active',
            'allow_concurrent_session'=> false,
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function student(): static
    {
        return $this->state(fn (array $attributes) => []);
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => []);
    }

    public function professor(): static
    {
        return $this->state(fn (array $attributes) => []);
    }

    public function tutor(): static
    {
        return $this->state(fn (array $attributes) => []);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'suspended',
        ]);
    }
}
