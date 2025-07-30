<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsManager
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->role !== 'manager') {
            return response()->json(['message' => 'Unauthorized. Managers only.'], 403);
        }

        return $next($request);
    }
}
