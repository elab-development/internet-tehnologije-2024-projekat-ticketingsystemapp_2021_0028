<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use App\Models\Task;

class StatisticsController extends Controller
{
    public function index()
    {
        $stats = Cache::remember('task_status_counts', 60, function () {
            return [
                'todo' => Task::where('status', 'todo')->count(),
                'in_progress' => Task::where('status', 'in_progress')->count(),
                'done' => Task::where('status', 'done')->count(),
            ];
        });

        return response()->json($stats);
    }
}
