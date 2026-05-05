<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Progress extends Model
{
    protected $table = 'progresses';

    public $timestamps = false;

    protected $fillable = [
        'enrollment_id', 'lesson_id',
        'watched_seconds', 'progress_pct', 'completed_at', 'updated_at',
    ];

    protected $casts = [
        'progress_pct'  => 'float',
        'completed_at'  => 'datetime',
        'updated_at'    => 'datetime',
    ];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
