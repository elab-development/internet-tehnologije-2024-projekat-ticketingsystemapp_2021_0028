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
}
