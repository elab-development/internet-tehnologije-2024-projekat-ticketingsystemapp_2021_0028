<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function me(Request $request)
    {
        return $request->user();
    }

    public function index(Request $request)
    {
        $auth = Auth::user();

        if ($auth->role === 'employee') {
            return User::where('id', $auth->id)->paginate($request->input('per_page', 10));
        }

        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($x) use ($q) {
                $x->where('name', 'like', "%{$q}%")
                  ->orWhere('email', 'like', "%{$q}%")
                  ->orWhere('position', 'like', "%{$q}%");
            });
        }

        $perPage = $request->input('per_page', 10);
        return $query->paginate($perPage);
    }

    public function show($id)
    {
        $auth = Auth::user();
        if ($auth->role === 'employee' && (int)$id !== (int)$auth->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        return User::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $auth = Auth::user();
        $user = User::findOrFail($id);

        if ($auth->role !== 'admin' && $auth->id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $rules = [
            'name' => 'sometimes|string|max:255',
            'position' => 'nullable|string|max:255',
        ];

        if ($auth->role === 'admin') {
            $rules['role'] = 'sometimes|string|in:admin,manager,employee';
        }

        $validated = $request->validate($rules);

        $user->update($validated);
        return response()->json($user);
    }

    public function destroy($id)
    {
        $auth = Auth::user();
        if ($auth->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }

    public function messageable(Request $request)
    {
        $auth = Auth::user();

        $q = User::query()
            ->where('id', '<>', $auth->id); 

        if ($request->filled('q')) {
            $term = $request->q;
            $q->where(function ($x) use ($term) {
                $x->where('name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('position', 'like', "%{$term}%");
            });
        }

        $perPage = $request->input('per_page', 25);
        return $q->orderBy('name')->paginate($perPage);
    }
}
