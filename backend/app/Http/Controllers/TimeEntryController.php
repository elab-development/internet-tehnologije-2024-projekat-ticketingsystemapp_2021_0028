<?php

namespace App\Http\Controllers;

use App\Models\TimeEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TimeEntryController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            return TimeEntry::with('task', 'user')->get();
        }

        return TimeEntry::with('task')
            ->where('user_id', $user->id)
            ->get();
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'hours' => 'required|numeric|min:0.1',
            'work_date' => 'required|date',
        ]);
    
        $timeEntry = TimeEntry::create([
            'user_id' => $user->id,
            'task_id' => $validated['task_id'],
            'hours' => $validated['hours'],
            'work_date' => $validated['work_date'],
        ]);


        return response()->json($timeEntry, 201);
    }

    public function show($id)
    {
        $timeEntry = TimeEntry::with('task')->findOrFail($id);
        $user = Auth::user();

        if ($user->role === 'admin' || $timeEntry->user_id === $user->id) {
            return $timeEntry;
        }

        return response()->json(['error' => 'Unauthorized'], 403);
    }

    public function update(Request $request, $id)
    {
        $timeEntry = TimeEntry::findOrFail($id);
        $user = Auth::user();

        if ($user->role !== 'admin' && $timeEntry->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'hours' => 'sometimes|numeric|min:0.1',
            'work_date' => 'sometimes|date',
        ]);

        $timeEntry->update($validated);


        return response()->json($timeEntry);
    }

    public function destroy($id)
    {
        $timeEntry = TimeEntry::findOrFail($id);
        $user = Auth::user();

        if ($user->role !== 'admin' && $timeEntry->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $timeEntry->delete();

        return response()->json(['message' => 'Time entry deleted']);
    }
}
