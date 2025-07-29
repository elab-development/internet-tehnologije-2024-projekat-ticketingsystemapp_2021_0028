<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Project;
use App\Models\Task;
use App\Models\Comment;
use App\Models\TimeEntry;
use App\Models\Event;
use App\Models\Message;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory(10)->create()->each(function ($user) {
            Project::factory(2)->create()->each(function ($project) use ($user) {
                $project->users()->attach($user->id);
            });
        
            Task::factory(3)->create(['assigned_to' => $user->id]);
            Comment::factory(2)->create(['user_id' => $user->id]);
            TimeEntry::factory(2)->create(['user_id' => $user->id]);
            Event::factory(1)->create(['user_id' => $user->id]);
            Message::factory(1)->create(['sender_id' => $user->id, 'receiver_id' => 1]);
        });
    }
}
