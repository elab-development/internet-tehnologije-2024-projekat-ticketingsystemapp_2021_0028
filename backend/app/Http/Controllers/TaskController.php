<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    public function index(Request $request)
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

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        $perPage = $request->input('per_page', 10);
        return $query->paginate($perPage);
    }


    public function store(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'manager'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'status' => 'nullable|string|in:todo,in_progress,done',
        ]);

        if (
            $user->role === 'manager' &&
            Project::find($validated['project_id'])->created_by !== $user->id
        ) {
            return response()->json(['error' => 'Unauthorized project'], 403);
        }

        $task = Task::create($validated);

        return response()->json($task, 201);
    }

    public function show($id)
    {
        $task = Task::with('project', 'user')->findOrFail($id);
        $user = Auth::user();

        if ($user->role === 'admin') {
            return $task;
        }

        if (
            $user->role === 'manager' &&
            $task->project->created_by === $user->id
        ) {
            return $task;
        }

        if (
            $user->role === 'employee' &&
            $task->assigned_to === $user->id
        ) {
            return $task;
        }

        return response()->json(['error' => 'Unauthorized'], 403);
    }

    public function update(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $user = Auth::user();

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'status' => 'nullable|string|in:todo,in_progress,done',
        ]);

        if ($user->role === 'admin' || ($user->role === 'manager' && $task->project->created_by === $user->id)) {
            $task->update($validated);
            return response()->json($task);
        }

        if (
            $user->role === 'employee' &&
            $task->assigned_to === $user->id &&
            isset($validated['status'])
        ) {
            $task->status = $validated['status'];
            $task->save();
            return response()->json($task);
        }

        return response()->json(['error' => 'Unauthorized'], 403);
    }

    public function destroy($id)
    {
        $task = Task::findOrFail($id);
        $user = Auth::user();

        if (
            $user->role === 'admin' ||
            ($user->role === 'manager' && $task->project->created_by === $user->id)
        ) {
            $task->delete();
            return response()->json(['message' => 'Task deleted']);
        }

        return response()->json(['error' => 'Unauthorized'], 403);
    }
}
