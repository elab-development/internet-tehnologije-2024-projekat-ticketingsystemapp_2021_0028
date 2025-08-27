<?php

namespace App\Http\Controllers;

use App\Models\TimeEntry;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TimeEntryController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if ($request->filled('task_id')) {
            return $this->indexByTask($request, (int) $request->input('task_id'));
        }

        $perPage = (int) $request->input('per_page', 50);
        $q = TimeEntry::with(['task.project', 'user']);

        if ($user->role === 'admin') {
            return $q->orderByDesc('work_date')->paginate($perPage);
        }

        if ($user->role === 'manager') {
            $q->whereHas('task.project', function ($qq) use ($user) {
                $qq->where('created_by', $user->id);
            });
            return $q->orderByDesc('work_date')->paginate($perPage);
        }

        $q->where('user_id', $user->id);
        return $q->orderByDesc('work_date')->paginate($perPage);
    }

    public function indexByTask(Request $request, int $taskId)
    {
        $user = Auth::user();
        $perPage = (int) $request->input('per_page', 50);

        $task = Task::with('project.users')->findOrFail($taskId);

        $canSeeAll = $this->canSeeAllForTask($user, $task);

        $q = TimeEntry::with(['task.project', 'user'])->where('task_id', $task->id);

        if (!$canSeeAll) {
            if ((int)$user->id !== (int)$task->assigned_to) {
                return response()->json(['error' => 'Forbidden'], 403);
            }
            $q->where('user_id', $user->id);
        }

        return $q->orderByDesc('work_date')->paginate($perPage);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'task_id'   => 'required|exists:tasks,id',
            'hours'     => 'required|numeric|min:0.25|max:24',
            'work_date' => 'required|date',
        ]);

        $user = Auth::user();
        $task = Task::with('project')->findOrFail($validated['task_id']);

        if (!($this->canManageTaskTime($user, $task) || (int)$user->id === (int)$task->assigned_to)) {
            return response()->json(['error' => 'You cannot add time to this task'], 403);
        }

        $entry = TimeEntry::create([
            'task_id'   => $task->id,
            'user_id'   => $user->id,
            'hours'     => $validated['hours'],
            'work_date' => $validated['work_date'],
        ]);

        return response()->json($entry->load('user', 'task.project'), 201);
    }

    public function update(Request $request, int $id)
    {
        $entry = TimeEntry::with('task.project')->findOrFail($id);
        $user = Auth::user();

        if (
            !($user->role === 'admin'
            || ($user->role === 'manager' && (int)$entry->task->project->created_by === (int)$user->id)
            || (int)$entry->user_id === (int)$user->id)
        ) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'hours'     => 'sometimes|numeric|min:0.25|max:24',
            'work_date' => 'sometimes|date',
        ]);

        $entry->fill($validated)->save();

        return response()->json($entry->fresh()->load('user', 'task.project'));
    }

    public function destroy(int $id)
    {
        $entry = TimeEntry::with('task.project')->findOrFail($id);
        $user = Auth::user();

        if (
            !($user->role === 'admin'
            || ($user->role === 'manager' && (int)$entry->task->project->created_by === (int)$user->id)
            || (int)$entry->user_id === (int)$user->id)
        ) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $entry->delete();

        return response()->json(['message' => 'Deleted']);
    }

    private function canSeeAllForTask($user, Task $task): bool
    {
        if ($user->role === 'admin') return true;
        if ($user->role === 'manager' && (int)$task->project->created_by === (int)$user->id) return true;
        if ((int)$task->assigned_to === (int)$user->id) return true;
        return false;
    }

    private function canManageTaskTime($user, Task $task): bool
    {
        if ($user->role === 'admin') return true;
        if ($user->role === 'manager' && (int)$task->project->created_by === (int)$user->id) return true;
        return false;
    }
}
