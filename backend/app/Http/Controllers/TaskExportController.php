<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TaskExportController extends Controller
{
    public function export(Request $request): StreamedResponse
    {
        $user = Auth::user();

        $query = Task::with('project', 'user');

        if ($user->role === 'manager') {
            $query->whereHas('project', function ($q) use ($user) {
                $q->where('created_by', $user->id);
            });
        } elseif ($user->role === 'employee') {
            $query->where('assigned_to', $user->id);
        }

        $tasks = $query->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="tasks_export.csv"',
        ];

        $callback = function () use ($tasks) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['ID', 'Title', 'Status', 'Assigned To', 'Project', 'Created At']);

            foreach ($tasks as $task) {
                fputcsv($handle, [
                    $task->id,
                    $task->title,
                    $task->status,
                    $task->user?->name ?? 'N/A',
                    $task->project?->name ?? 'N/A',
                    $task->created_at,
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
