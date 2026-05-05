<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamQuestion extends Model
{
    protected $fillable = [
        'exam_id', 'order_no', 'type', 'body',
        'choices', 'correct_answer', 'score',
    ];

    protected $casts = [
        'choices'        => 'array',
        'correct_answer' => 'array',
        'score'          => 'integer',
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }
}
