<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ProjectCollection extends ResourceCollection
{
    public $collects = ProjectResource::class;

    /** @return array<string,mixed> */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
        ];
    }

    /** @return array<string,mixed> */
    public function with(Request $request): array
    {
        $p = $this->resource;
        return [
            'meta' => [
                'current_page' => $p->currentPage(),
                'per_page'     => $p->perPage(),
                'total'        => $p->total(),
                'last_page'    => $p->lastPage(),
            ],
        ];
    }
}
