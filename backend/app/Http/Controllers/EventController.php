<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $perPage = (int) $request->input('per_page', 50);

        $q = \App\Models\Event::with('project');

        if ($user->role === 'admin') {
            return $q->orderBy('start_time')->paginate($perPage);
        }

        if ($user->role === 'manager') {
            $q->whereHas('project', function ($qq) use ($user) {
                $qq->where('created_by', $user->id)
                ->orWhereHas('users', function ($q2) use ($user) {
                    $q2->where('users.id', $user->id);
                });
            });
            return $q->orderBy('start_time')->paginate($perPage);
        }

        $q->whereHas('project.users', function ($qq) use ($user) {
            $qq->where('users.id', $user->id);
        });

        return $q->orderBy('start_time')->paginate($perPage);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'project_id' => 'nullable|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
        ]);

        if (
            $user->role === 'manager' &&
            $validated['project_id'] &&
            Project::find($validated['project_id'])->created_by !== $user->id
        ) {
            return response()->json(['error' => 'Unauthorized project'], 403);
        }

        $event = Event::create([
            'user_id' => $user->id,
            'project_id' => $validated['project_id'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? '',
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
        ]);

        return response()->json($event, 201);
    }

    public function show($id)
    {
        $event = Event::with('project')->findOrFail($id);
        $user = Auth::user();

        if (
            $user->role === 'admin' ||
            $event->user_id === $user->id ||
            ($user->role === 'manager' && $event->project && $event->project->created_by === $user->id)
        ) {
            return $event;
        }

        return response()->json(['error' => 'Unauthorized'], 403);
    }

    public function update(Request $request, $id)
    {
        $event = Event::findOrFail($id);
        $user = Auth::user();

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'sometimes|date',
            'end_time' => 'sometimes|date|after:start_time',
        ]);

        if (
            $user->role !== 'admin' &&
            $event->user_id !== $user->id &&
            !($user->role === 'manager' && $event->project && $event->project->created_by === $user->id)
        ) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $event->update($validated);
        return response()->json($event);
    }

    public function destroy($id)
    {
        $event = Event::findOrFail($id);
        $user = Auth::user();

        if (
            $user->role !== 'admin' &&
            $event->user_id !== $user->id &&
            !($user->role === 'manager' && $event->project && $event->project->created_by === $user->id)
        ) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $event->delete();
        return response()->json(['message' => 'Event deleted']);
    }
}
