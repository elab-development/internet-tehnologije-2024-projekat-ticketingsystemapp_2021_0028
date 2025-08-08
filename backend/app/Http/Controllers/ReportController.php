<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function userWorkHours()
    {
        $report = DB::table('time_entries')
            ->join('users', 'time_entries.user_id', '=', 'users.id')
            ->select(
                'users.id as user_id',
                'users.name',
                'users.position',
                DB::raw('SUM(time_entries.hours) as total_hours')
            )
            ->groupBy('users.id', 'users.name', 'users.position')
            ->get();

        return response()->json($report);
    }
}
