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
            // 1. Kreiramo 2 projekta po korisniku
            $projects = Project::factory(2)->create([
                'created_by' => $user->id,
            ]);


            // 2. Povezujemo korisnika sa svakim projektom
            foreach ($projects as $project) {
                $project->users()->attach($user->id);

                // 3. Kreiramo 3 taska po projektu i vežemo za korisnika i projekat
                Task::factory(3)->create([
                    'assigned_to' => $user->id,
                    'project_id' => $project->id,
                ]);

                // 4. Kreiramo 1 event po projektu
                Event::factory()->create([
                    'user_id' => $user->id,
                    'project_id' => $project->id,
                ]);
            }

            // 5. Ostali entiteti
            Comment::factory(2)->create(['user_id' => $user->id]);
            TimeEntry::factory(2)->create(['user_id' => $user->id]);
            Message::factory(1)->create([
                'sender_id' => $user->id,
                'receiver_id' => 1
            ]);
        });
}

}
