<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'assigned_to',
        'title',
        'description',
        'status',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
    
    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
    
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
    
    public function timeEntries()
    {
        return $this->hasMany(TimeEntry::class);
    }

}
