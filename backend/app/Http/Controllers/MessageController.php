<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;

class MessageController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            return Message::with('sender', 'receiver')->get();
        }

        return Message::with('sender', 'receiver')
            ->where('sender_id', $user->id)
            ->orWhere('receiver_id', $user->id)
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'content' => 'required|string',
        ]);

        $message = Message::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $validated['receiver_id'],
            'content' => $validated['content'],
            'sent_at' => Carbon::now(),
            'read_at' => null,
        ]);

        return response()->json($message, 201);
    }

    public function show($id)
    {
        $message = Message::with('sender', 'receiver')->findOrFail($id);
        $user = Auth::user();

        if (
            $user->role === 'admin' ||
            $message->sender_id === $user->id ||
            $message->receiver_id === $user->id
        ) {
            if ($message->receiver_id === $user->id && $message->read_at === null) {
                $message->read_at = Carbon::now();
                $message->save();
            }

            return response()->json($message);
        }

        return response()->json(['error' => 'Unauthorized'], 403);
    }

    public function destroy($id)
    {
        $message = Message::findOrFail($id);
        $user = Auth::user();

        if (
            $user->role === 'admin' ||
            $message->sender_id === $user->id
        ) {
            $message->delete();
            return response()->json(['message' => 'Message deleted']);
        }

        return response()->json(['error' => 'Unauthorized'], 403);
    }
}
