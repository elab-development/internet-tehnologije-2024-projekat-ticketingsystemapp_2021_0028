<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            return Comment::with('task', 'user')->get();
        }

        return Comment::with('task', 'user')->where('user_id', $user->id)->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'content' => 'required|string',
        ]);

        $comment = Comment::create([
            'user_id' => Auth::id(),
            'task_id' => $validated['task_id'],
            'content' => $validated['content'],
        ]);

        return response()->json($comment, 201);
    }

    public function show($id)
    {
        $comment = Comment::with('task', 'user')->findOrFail($id);
        $user = Auth::user();

        if ($user->role === 'admin' || $comment->user_id === $user->id) {
            return $comment;
        }

        return response()->json(['error' => 'Unauthorized'], 403);
    }

    public function update(Request $request, $id)
    {
        $comment = Comment::findOrFail($id);
        $user = Auth::user();

        if ($user->id !== $comment->user_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $comment->update($validated);

        return response()->json($comment);
    }

    public function destroy($id)
    {
        $comment = Comment::findOrFail($id);
        $user = Auth::user();

        if ($user->id !== $comment->user_id && $user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted']);
    }
}
