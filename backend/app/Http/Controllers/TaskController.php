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

        // MARK: NEW — bazni upit sa relacijama
        $query = Task::with(['project', 'user']);

        // MARK: NEW — ako je tražen project_id, radimo autorizaciju po projektu i vraćamo taskove tog projekta
        if ($request->filled('project_id')) {
            $projectId = (int) $request->project_id;
            $project = Project::with('users')->findOrFail($projectId);

            // admin: sve
            if ($user->role === 'admin') {
                $query->where('project_id', $projectId);
            }
            // manager: samo sopstveni projekti
            elseif ($user->role === 'manager') {
                if ((int)$project->created_by !== (int)$user->id) {
                    return response()->json(['error' => 'Unauthorized project'], 403);
                }
                $query->where('project_id', $projectId);
            }
            // employee: mora biti član projekta da vidi taskove
            else {
                $isMember = $project->users->contains('id', $user->id);
                if (!$isMember) {
                    return response()->json(['error' => 'Unauthorized project'], 403);
                }
                $query->where('project_id', $projectId);
            }
        } else {
            // MARK: OLD BEHAVIOR — kad NEMA project_id filtera, zadržavamo dosadašnja pravila
            if ($user->role === 'manager') {
                $query->whereHas('project', function ($q) use ($user) {
                    $q->where('created_by', $user->id);
                });
            } elseif ($user->role === 'employee') {
                $query->where('assigned_to', $user->id);
            }
        }

        // postojeći filteri ostaju
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%');
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

        // MARK: NEW — vratimo sa relacijama da frontend odmah ima user i project
        return response()->json($task->load(['project', 'user']), 201);
    }

    public function show($id)
    {
        $task = Task::with(['project', 'user'])->findOrFail($id); // MARK: keep relations loaded
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
        $task = Task::with(['project', 'user'])->findOrFail($id); // MARK: keep relations loaded
        $user = Auth::user();

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'status' => 'nullable|string|in:todo,in_progress,done',
        ]);

        if ($user->role === 'admin' || ($user->role === 'manager' && $task->project->created_by === $user->id)) {
            $task->update($validated);
            return response()->json($task->load(['project', 'user'])); // MARK: ensure relations in response
        }

        if (
            $user->role === 'employee' &&
            $task->assigned_to === $user->id &&
            isset($validated['status'])
        ) {
            $task->status = $validated['status'];
            $task->save();
            return response()->json($task->load(['project', 'user'])); // MARK: ensure relations in response
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
