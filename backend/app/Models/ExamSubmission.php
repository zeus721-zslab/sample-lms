<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamSubmission extends Model
{
    protected $fillable = [
        'exam_id', 'user_id', 'enrollment_id',
        'started_at', 'submitted_at', 'status',
        'total_score', 'pass_yn',
    ];

    protected $casts = [
        'started_at'   => 'datetime',
        'submitted_at' => 'datetime',
        'total_score'  => 'integer',
        'pass_yn'      => 'boolean',
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(ExamAnswer::class, 'submission_id');
    }

    /**
     * 자동 채점 가능한 문제 유형(single/multiple/short)에 대해 채점 수행.
     * essay가 없으면 status=graded, 있으면 submitted.
     */
    public function autoGrade(): void
    {
        $this->load('answers.question');

        $totalScore    = 0;
        $hasEssay      = false;

        foreach ($this->answers as $answer) {
            $q = $answer->question;
            if (!$q) {
                continue;
            }

            $earned = match ($q->type) {
                'single', 'multiple' => $this->gradeObjective($q, $answer),
                'short'              => $this->gradeShort($q, $answer),
                'essay'              => null,   // 수동 채점 대기
                default              => 0,
            };

            if ($q->type === 'essay') {
                $hasEssay = true;
            } else {
                $answer->score = $earned;
                $answer->save();
                $totalScore += $earned;
            }
        }

        $this->total_score  = $totalScore;
        $this->pass_yn      = $totalScore >= $this->exam->pass_score;
        $this->submitted_at = now();
        $this->status       = $hasEssay ? 'submitted' : 'graded';
        $this->save();
    }

    private function gradeObjective(ExamQuestion $q, ExamAnswer $answer): int
    {
        $correct  = $q->correct_answer ?? [];
        $submitted = $answer->answer ?? [];

        // 배열 정규화 (JSON에서 풀면 항상 array)
        $correctSorted  = $correct;
        $submittedSorted = $submitted;
        sort($correctSorted);
        sort($submittedSorted);

        return $correctSorted === $submittedSorted ? $q->score : 0;
    }

    private function gradeShort(ExamQuestion $q, ExamAnswer $answer): int
    {
        $correct   = trim(strtolower(implode('', $q->correct_answer ?? [])));
        $submitted = trim(strtolower(implode('', $answer->answer ?? [])));

        // 공백 정규화
        $correct   = preg_replace('/\s+/', ' ', $correct);
        $submitted = preg_replace('/\s+/', ' ', $submitted);

        return $correct === $submitted ? $q->score : 0;
    }
}
