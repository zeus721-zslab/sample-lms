<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CertificateVerification extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'issue_id', 'verified_at', 'verifier_ip',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function issue(): BelongsTo
    {
        return $this->belongsTo(CertificateIssue::class, 'issue_id');
    }
}
