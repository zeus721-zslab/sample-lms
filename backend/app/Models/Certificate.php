<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Certificate extends Model
{
    protected $fillable = [
        'code', 'name', 'issuer', 'template_path', 'required_pass_yn',
    ];

    protected $casts = [
        'required_pass_yn' => 'boolean',
    ];

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'certificate_courses');
    }

    public function issues(): HasMany
    {
        return $this->hasMany(CertificateIssue::class);
    }
}
