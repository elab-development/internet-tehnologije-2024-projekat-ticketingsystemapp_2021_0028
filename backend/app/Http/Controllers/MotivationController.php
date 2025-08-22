<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request; 
use Illuminate\Support\Facades\Http;

class MotivationController extends Controller
{
    public function index(Request $request) 
    {
        
        
        $tags = $request->query('tags', 'work|business|success|motivational|productivity|team'); 

        
        if ($q = $this->fromQuotable($tags)) { 
            return response()->json($q);
        }

        
        if ($q = $this->fromZenQuotes()) {
            return response()->json($q);
        }

        
        if ($q = $this->fromTypeFit()) {
            return response()->json($q);
        }

        
        $fallbacks = $this->customMessages(); 
        $pick = $fallbacks[array_rand($fallbacks)];

        return response()->json($pick);
    }

    private function http()
    {
        
        return Http::timeout(5)
            ->retry(2, 200)
            ->withHeaders(['User-Agent' => 'MotivationFetcher/1.1'])
            ->acceptJson();
    }

    private function fromQuotable(string $tags): ?array 
    {
        try {
            $res = $this->http()->get('https://api.quotable.io/random', [
                'tags' => $tags, 
            ]);
            if ($res->successful()) {
                $j = $res->json();
                $text = $j['content'] ?? null;
                $author = $j['author'] ?? 'Unknown';
                if ($text) {
                    return ['quote' => $text, 'author' => $author, 'source' => 'quotable'];
                }
            }
        } catch (\Throwable $e) {}
        return null;
    }

    private function fromZenQuotes(): ?array
    {
        try {
            $res = $this->http()->get('https://zenquotes.io/api/random');
            if ($res->successful()) {
                $j = $res->json();
                if (is_array($j) && isset($j[0])) {
                    $text = $j[0]['q'] ?? null;
                    $author = $j[0]['a'] ?? 'Unknown';
                    if ($text) {
                        return ['quote' => $text, 'author' => $author, 'source' => 'zenquotes'];
                    }
                }
            }
        } catch (\Throwable $e) {}
        return null;
    }

    private function fromTypeFit(): ?array
    {
        try {
            $res = $this->http()->get('https://type.fit/api/quotes');
            if ($res->successful()) {
                $arr = $res->json();
                if (is_array($arr) && count($arr) > 0) {
                    
                    
                    $keywords = ['work','team','product','goal','lead','success','project','focus'];
                    for ($i = 0; $i < 15; $i++) {
                        $rand = $arr[array_rand($arr)];
                        $text = $rand['text'] ?? null;
                        $author = $rand['author'] ?? 'Unknown';
                        if ($text && $this->containsAny($text, $keywords)) {
                            return ['quote' => $text, 'author' => $author, 'source' => 'type.fit'];
                        }
                    }
                    
                    $rand = $arr[array_rand($arr)];
                    $text = $rand['text'] ?? null;
                    $author = $rand['author'] ?? 'Unknown';
                    if ($text) {
                        return ['quote' => $text, 'author' => $author, 'source' => 'type.fit'];
                    }
                }
            }
        } catch (\Throwable $e) {}
        return null;
    }

    private function customMessages(): array 
    {
        return [
            ["quote" => "Teamwork divides the task and multiplies the success.", "author" => "Unknown"],
            ["quote" => "Small progress every day beats big excuses.", "author" => "Project Wisdom Bot"],
            ["quote" => "Deadlines love discipline. Keep pushing forward.", "author" => "Agile Coach"],
            ["quote" => "One bug fixed today saves ten tomorrow.", "author" => "Dev Proverb"],
            ["quote" => "Good communication is the real MVP of every project.", "author" => "Scrum Master"],
            ["quote" => "Stay focused—tiny wins ship big features.", "author" => "Team Lead"],
            ["quote" => "Remember: coffee is part of the workflow ☕", "author" => "Team Lead"],
            ["quote" => "Clear goals. Short feedback loops. Strong delivery.", "author" => "Project Guide"],
        ];
    }

    private function containsAny(string $text, array $needles): bool
    {
        $l = mb_strtolower($text);
        foreach ($needles as $n) {
            if (mb_strpos($l, $n) !== false) return true;
        }
        return false;
    }
}
