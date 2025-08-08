<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function store(Request $request, $taskId)
    {
        $request->validate([
            'file' => 'required|file|max:2048',
        ]);

        $task = Task::findOrFail($taskId);
        $user = Auth::user();

        if (
            $user->role === 'admin' ||
            ($user->role === 'manager' && $task->project->created_by === $user->id) ||
            ($user->role === 'employee' && $task->assigned_to === $user->id)
        ) {
            $uploaded = $request->file('file');
            $path = $uploaded->store('attachments', 'public');

            $attachment = Attachment::create([
                'task_id' => $task->id,
                'file_path' => $path,
                'original_name' => $uploaded->getClientOriginalName(),
            ]);

            return response()->json($attachment, 201);
        }

        return response()->json(['error' => 'Unauthorized'], 403);
    }

    public function download($id)
    {
        $attachment = Attachment::findOrFail($id);
        $user = Auth::user();

        if (
            $user->role === 'admin' ||
            ($user->role === 'manager' && $attachment->task->project->created_by === $user->id) ||
            ($user->role === 'employee' && $attachment->task->assigned_to === $user->id)
        ) {
            $path = storage_path("app/public/{$attachment->file_path}");
            return response()->download($path, $attachment->original_name);

        }

        return response()->json(['error' => 'Unauthorized'], 403);
    }
}
