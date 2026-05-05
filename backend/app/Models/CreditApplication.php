<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditApplication extends Model
{
    protected $fillable = [
        'user_id', 'semester_id', 'applied_at', 'status',
        'note', 'nile_submitted_at', 'result_received_at',
    ];

    protected $casts = [
        'applied_at'          => 'datetime',
        'nile_submitted_at'   => 'datetime',
        'result_received_at'  => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    /** 신청 대기 중인 항목 */
    public function scopeRequested(Builder $query): Builder
    {
        return $query->where('status', 'requested');
    }
}
