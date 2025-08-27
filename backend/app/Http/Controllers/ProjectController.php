<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $q = Project::with('users');

        if ($user->role === 'admin') {
        } elseif ($user->role === 'manager') {
            $q->where(function ($qq) use ($user) {
                $qq->where('created_by', $user->id)
                   ->orWhereHas('users', fn($u) => $u->where('users.id', $user->id));
            });
        } else {
            $q->whereHas('users', fn($u) => $u->where('users.id', $user->id));
        }

        $perPage = $request->input('per_page', 20);
        if ($perPage === 'all') {
            return $q->get();
        }

        return $q->paginate((int)$perPage);
    }

    public function show($id)
    {
        $project = Project::with(['users', 'tasks.user', 'events'])->findOrFail($id);
        $this->authorizeView($project);
        return response()->json($project);
    }

    public function store(Request $request)
{
    $user = Auth::user();
    if (!$user) {
        return response()->json(['error' => 'Unauthenticated'], 401);
    }
    if (!in_array($user->role, ['admin', 'manager'])) {
        return response()->json(['error' => 'Only managers/admins can create projects'], 403);
    }

    $validated = $request->validate([
        'name'        => 'required|string|max:255',
        'description' => 'nullable|string',
    ]);

    $project = DB::transaction(function () use ($validated, $user) {
        $project = \App\Models\Project::create([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'created_by'  => $user->id,
        ]);

        $project->users()->syncWithoutDetaching([$user->id]);

        return $project->load('users');
    });

    return response()->json($project, 201);
}


    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $user = Auth::user();

        if (!($user->role === 'admin' || ($user->role === 'manager' && $project->created_by === $user->id))) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $project->update($validated);

        return response()->json($project->fresh()->load('users'));
    }

    public function destroy($id)
    {
        $project = Project::findOrFail($id);
        $user = Auth::user();

        if (!($user->role === 'admin' || ($user->role === 'manager' && $project->created_by === $user->id))) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $project->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function membersIndex($id)
    {
        $project = Project::with('users')->findOrFail($id);
        $this->authorizeView($project);
        return response()->json($project->users);
    }

    public function membersStore(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $user = Auth::user();

        if (!($user->role === 'admin' || ($user->role === 'manager' && $project->created_by === $user->id))) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'user_ids'   => 'array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $ids = $data['user_ids'] ?? [];
        $project->users()->syncWithoutDetaching($ids);

        return response()->json(['attached' => $ids]);
    }

    public function membersDestroy($id, $userId)
    {
        $project = Project::findOrFail($id);
        $user = Auth::user();

        if (!($user->role === 'admin' || ($user->role === 'manager' && $project->created_by === $user->id))) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $project->users()->detach($userId);
        return response()->json(['detached' => $userId]);
    }

    protected function authorizeView(Project $project): void
    {
        $user = Auth::user();
        if ($user->role === 'admin') return;
        if ($user->role === 'manager' && $project->created_by === $user->id) return;
        if ($project->users()->where('users.id', $user->id)->exists()) return;

        abort(403, 'Forbidden');
    }
}
