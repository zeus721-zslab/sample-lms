<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseOffering extends Model
{
    protected $fillable = [
        'course_id', 'semester_id', 'tutor_id',
        'max_students', 'current_students', 'status',
    ];

    protected $casts = [
        'max_students'     => 'integer',
        'current_students' => 'integer',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'offering_id');
    }

    /** 수강신청 가능 여부 */
    public function isEnrollable(): bool
    {
        return $this->status === 'open'
            && $this->semester->status === 'enrolling'
            && $this->current_students < $this->max_students;
    }
}
