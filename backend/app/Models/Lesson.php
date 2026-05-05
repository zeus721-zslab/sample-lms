<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    protected $fillable = [
        'course_id', 'chapter', 'order_no', 'title',
        'video_url', 'duration_sec', 'materials',
    ];

    protected $casts = [
        'materials'    => 'array',
        'duration_sec' => 'integer',
        'chapter'      => 'integer',
        'order_no'     => 'integer',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function progresses(): HasMany
    {
        return $this->hasMany(Progress::class);
    }
}
