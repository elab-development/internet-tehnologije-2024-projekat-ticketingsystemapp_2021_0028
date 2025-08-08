<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;

class MotivationController extends Controller
{
    public function index()
    {
        $response = Http::get('https://type.fit/api/quotes');

        if ($response->successful()) {
            $quotes = $response->json();
            $randomQuote = $quotes[array_rand($quotes)];

            return response()->json([
                'quote' => $randomQuote['text'] ?? 'Keep going!',
                'author' => $randomQuote['author'] ?? 'Unknown',
            ]);
        }

        return response()->json(['error' => 'Failed to fetch quote'], 500);
    }
}
