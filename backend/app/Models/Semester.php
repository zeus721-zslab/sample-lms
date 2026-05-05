<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Semester extends Model
{
    protected $fillable = [
        'year', 'term', 'start_date', 'end_date',
        'enroll_start_at', 'enroll_end_at',
        'class_start_at', 'class_end_at',
        'status',
    ];

    protected $casts = [
        'year'           => 'integer',
        'start_date'     => 'date',
        'end_date'       => 'date',
        'enroll_start_at' => 'datetime',
        'enroll_end_at'  => 'datetime',
        'class_start_at' => 'datetime',
        'class_end_at'   => 'datetime',
    ];

    public function offerings(): HasMany
    {
        return $this->hasMany(CourseOffering::class);
    }

    /** 수강신청 중인 학기 */
    public function scopeEnrolling(Builder $query): Builder
    {
        return $query->where('status', 'enrolling');
    }

    /** 수업 진행 중인 학기 */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }
}
