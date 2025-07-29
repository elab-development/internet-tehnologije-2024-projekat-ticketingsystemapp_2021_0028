<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TimeEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'task_id',
        'hours',
        'work_date',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }

}
