<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademicRecord extends Model
{
    protected $fillable = [
        'enrollment_id',
        'attendance_score', 'assignment_score',
        'midterm_score', 'final_score',
        'total_score', 'final_grade',
        'credit_earned', 'pass_yn',
    ];

    protected $casts = [
        'attendance_score' => 'float',
        'assignment_score' => 'float',
        'midterm_score'    => 'float',
        'final_score'      => 'float',
        'total_score'      => 'float',
        'credit_earned'    => 'integer',
        'pass_yn'          => 'boolean',
    ];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    /**
     * 가중치 합산 → total_score, final_grade, pass_yn 계산
     * 출석 30 + 과제 20 + 중간 20 + 기말 30
     */
    public function calculateGrade(): void
    {
        $attendance = (float) ($this->attendance_score ?? 0);
        $assignment = (float) ($this->assignment_score ?? 0);
        $midterm    = (float) ($this->midterm_score ?? 0);
        $final      = (float) ($this->final_score ?? 0);

        $total = round(
            $attendance * 0.30
            + $assignment * 0.20
            + $midterm    * 0.20
            + $final      * 0.30,
            2
        );

        $this->total_score = $total;
        $this->pass_yn     = $total >= 60;
        $this->final_grade = match (true) {
            $total >= 90 => 'A+',
            $total >= 85 => 'A',
            $total >= 80 => 'B+',
            $total >= 75 => 'B',
            $total >= 70 => 'C+',
            $total >= 65 => 'C',
            $total >= 60 => 'D+',
            $total >= 55 => 'D',
            default      => 'F',
        };
    }
}
