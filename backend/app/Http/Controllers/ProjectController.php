<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            return Project::with('users')->get();
        }

        if ($user->role === 'manager') {
            return Project::with('users')->where('created_by', $user->id)->get();
        }

        return $user->projects->load('users');
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'manager'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $project = Project::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
            'created_by' => $user->id,
        ]);

        $project->users()->attach($user->id);

        return response()->json($project, 201);
    }

    public function show(string $id)
    {
        $user = Auth::user();
        $project = Project::with('users')->findOrFail($id);

        if (
            $user->role === 'admin' ||
            ($user->role === 'manager' && $project->created_by == $user->id) ||
            ($user->role === 'employee' && $project->users->contains($user->id))
        ) {
            return $project;
        }

        return response()->json(['error' => 'Not authorized'], 403);
    }

    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $project = Project::findOrFail($id);

        if (
            $user->role !== 'admin' &&
            !($user->role === 'manager' && $project->created_by == $user->id)
        ) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
        ]);

        $project->update($validated);

        return response()->json($project);
    }

    public function destroy(string $id)
    {
        $user = Auth::user();
        $project = Project::findOrFail($id);

        if (
            $user->role !== 'admin' &&
            !($user->role === 'manager' && $project->created_by == $user->id)
        ) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $project->delete();

        return response()->json(['message' => 'Project deleted']);
    }

    // ===== MEMBERS ENDPOINTS =====

    // CHANGE: GET /projects/{id}/members — listanje članova
    public function membersIndex($id)
    {
        $auth = Auth::user();
        $project = Project::with('users')->findOrFail($id);

        // Dozvoljeno svima koji imaju pristup projektu (isti uslovi kao show)
        if (
            $auth->role === 'admin' ||
            ($auth->role === 'manager' && $project->created_by == $auth->id) ||
            ($auth->role === 'employee' && $project->users->contains($auth->id))
        ) {
            return $project->users;
        }

        return response()->json(['error' => 'Unauthorized'], 403);
    }

    // CHANGE: POST /projects/{id}/members — dodavanje članova (attach)
    // body: { user_ids: [1,2,3] }
    public function membersStore(Request $request, $id)
    {
        $auth = Auth::user();
        $project = Project::with('users')->findOrFail($id);

        // Samo admin ili manager koji je vlasnik projekta
        if (
            $auth->role !== 'admin' &&
            !($auth->role === 'manager' && $project->created_by == $auth->id)
        ) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        // attach bez dupliranja
        $project->users()->syncWithoutDetaching($data['user_ids']);

        // vrati sve članove posle izmene
        return response()->json($project->users()->get());
    }

    // CHANGE: DELETE /projects/{id}/members/{userId} — uklanjanje člana (detach)
    public function membersDestroy($id, $userId)
    {
        $auth = Auth::user();
        $project = Project::with('users')->findOrFail($id);

        // Samo admin ili manager koji je vlasnik projekta
        if (
            $auth->role !== 'admin' &&
            !($auth->role === 'manager' && $project->created_by == $auth->id)
        ) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $project->users()->detach($userId);

        return response()->json(['message' => 'Member detached']);
    }
}
