<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'course_id', 'offering_id',
        'order_no', 'amount', 'status',
        'paid_at', 'cancelled_at',
        'pg_provider', 'pg_transaction_id',
    ];

    protected $casts = [
        'amount'       => 'integer',
        'paid_at'      => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function offering(): BelongsTo
    {
        return $this->belongsTo(CourseOffering::class, 'offering_id');
    }
}
