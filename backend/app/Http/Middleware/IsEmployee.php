<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsEmployee
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->role !== 'employee') {
            return response()->json(['message' => 'Unauthorized. Employees only.'], 403);
        }

        return $next($request);
    }
}
