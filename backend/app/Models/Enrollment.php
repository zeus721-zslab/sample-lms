<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Enrollment extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'user_id', 'course_id', 'offering_id',
        'status', 'enrolled_at', 'completed_at',
    ];

    protected $casts = [
        'enrolled_at'  => 'datetime',
        'completed_at' => 'datetime',
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

    public function progresses(): HasMany
    {
        return $this->hasMany(Progress::class);
    }

    public function academicRecord(): HasOne
    {
        return $this->hasOne(AcademicRecord::class);
    }

    /** 현재 학습 중인 수강 (paid 또는 studying) */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', ['paid', 'studying']);
    }
}
