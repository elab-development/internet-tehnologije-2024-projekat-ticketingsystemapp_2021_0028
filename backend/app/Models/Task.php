<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
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
