<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('now', '+1 week');
        $end = (clone $start)->modify('+2 hours');
        
        return [
            'user_id' => \App\Models\User::factory(),
            'project_id' => \App\Models\Project::factory(),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'start_time' => $start,
            'end_time' => $end,
        ];
    }
}
