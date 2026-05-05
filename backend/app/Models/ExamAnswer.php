<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAnswer extends Model
{
    protected $fillable = [
        'submission_id', 'question_id',
        'answer', 'score', 'graded_by', 'graded_at',
    ];

    protected $casts = [
        'answer'     => 'array',
        'score'      => 'integer',
        'graded_at'  => 'datetime',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(ExamSubmission::class, 'submission_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(ExamQuestion::class, 'question_id');
    }
}
