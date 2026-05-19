<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Zslab\Search\Contracts\Searchable;

class Course extends Model implements Searchable
{
    use HasFactory;

    protected $fillable = [
        'course_type', 'category_id', 'title', 'slug', 'description',
        'thumbnail', 'credit_hours', 'total_lessons', 'price',
        'instructor_id', 'status', 'mode',
    ];

    protected $casts = [
        'price'        => 'integer',
        'credit_hours' => 'integer',
        'total_lessons'=> 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('chapter')->orderBy('order_no');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function offerings(): HasMany
    {
        return $this->hasMany(CourseOffering::class);
    }

    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function certificates(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Certificate::class, 'certificate_courses');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    public function toSearchArray(): array
    {
        $this->loadMissing('category', 'instructor');

        return [
            'id'            => $this->id,
            'title'         => $this->title,
            'description'   => $this->description,
            'slug'          => $this->slug,
            'course_type'   => $this->course_type,
            'status'        => $this->status,
            'category'      => $this->category?->name,
            'instructor'    => $this->instructor?->name,
            'title_suggest' => $this->title,
        ];
    }

    public static function getSearchIndex(): string
    {
        return 'lms_courses';
    }

    public static function getSearchFields(): array
    {
        return ['title^3', 'description', 'category', 'instructor'];
    }
}
