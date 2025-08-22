<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User; 
use Illuminate\Http\Request; 
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB; 

class MessageController extends Controller
{
    
    public function index(Request $request) 
    {
        $user = Auth::user();

        
        if ($request->filled('peer_id')) {
            return $this->thread($request, $request->integer('peer_id')); 
        }

        if ($user->role === 'admin') {
            return Message::with('sender', 'receiver')
                ->orderByDesc('sent_at')
                ->paginate($request->input('per_page', 50)); 
        }

        return Message::with('sender', 'receiver')
            ->where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                  ->orWhere('receiver_id', $user->id);
            })
            ->orderByDesc('sent_at')
            ->paginate($request->input('per_page', 50)); 
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

        
        return response()->json($message->load('sender', 'receiver'), 201); 
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

    
    
    
    
    public function peers(Request $request) 
    {
        $authId = Auth::id();

        
        $sub = Message::select(
                DB::raw("CASE WHEN sender_id = {$authId} THEN receiver_id ELSE sender_id END as peer_id"),
                DB::raw("MAX(sent_at) as last_time")
            )
            ->where(function ($q) use ($authId) {
                $q->where('sender_id', $authId)->orWhere('receiver_id', $authId);
            })
            ->groupBy('peer_id');

        $rows = DB::table(DB::raw("({$sub->toSql()}) as t"))
            ->mergeBindings($sub->getQuery())
            ->orderByDesc('last_time')
            ->get();

        $peerIds = $rows->pluck('peer_id')->all();
        $users = User::whereIn('id', $peerIds)->get()->keyBy('id');

        
        $unreads = Message::select('sender_id', DB::raw('COUNT(*) as c'))
            ->where('receiver_id', $authId)
            ->whereNull('read_at')
            ->groupBy('sender_id')
            ->pluck('c', 'sender_id');

        $result = $rows->map(function ($r) use ($users, $unreads) {
            $u = $users[$r->peer_id] ?? null;
            return [
                'peer' => $u ? [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->role,
                    'position' => $u->position,
                ] : null,
                'last_time' => $r->last_time,
                'unread' => (int)($unreads[$r->peer_id] ?? 0),
            ];
        });

        return response()->json($result->values());
    }

    
    
    
    
    
    public function thread(Request $request, int $peerId) 
    {
        $authId = Auth::id();

        
        $q = Message::with('sender', 'receiver')
            ->where(function ($q) use ($authId, $peerId) {
                $q->where(function ($qq) use ($authId, $peerId) {
                    $qq->where('sender_id', $authId)->where('receiver_id', $peerId);
                })->orWhere(function ($qq) use ($authId, $peerId) {
                    $qq->where('sender_id', $peerId)->where('receiver_id', $authId);
                });
            })
            ->orderBy('sent_at', 'asc');

        
        $perPage = $request->input('per_page', 20);
        $msgs = $q->paginate($perPage);

        
        Message::where('sender_id', $peerId)
            ->where('receiver_id', $authId)
            ->whereNull('read_at')
            ->update(['read_at' => Carbon::now()]);

        return response()->json($msgs);
    }

    
    
    
    
    public function markRead(int $peerId) 
    {
        $authId = Auth::id();
        $count = Message::where('sender_id', $peerId)
            ->where('receiver_id', $authId)
            ->whereNull('read_at')
            ->update(['read_at' => Carbon::now()]);

        return response()->json(['updated' => $count]);
    }
}
