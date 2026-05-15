<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class CertificateIssue extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'certificate_id', 'enrollment_id',
        'serial_no', 'verify_token',
        'issued_at', 'expires_at', 'pdf_path',
        'status', 'revoked_at', 'revoked_reason',
    ];

    protected $casts = [
        'issued_at'  => 'datetime',
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function certificate(): BelongsTo
    {
        return $this->belongsTo(Certificate::class);
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function verifications(): HasMany
    {
        return $this->hasMany(CertificateVerification::class, 'issue_id');
    }

    /** ZSLAB-YYYY-NNNNNN 형식 일련번호 생성 */
    public static function generateSerialNo(): string
    {
        $year = now()->format('Y');
        $seq  = str_pad((string)(static::whereYear('issued_at', $year)->count() + 1), 6, '0', STR_PAD_LEFT);
        return "ZSLAB-{$year}-{$seq}";
    }

    /** 32자 랜덤 hex 토큰 생성 */
    public static function generateVerifyToken(): string
    {
        return bin2hex(random_bytes(16)); // 16 bytes = 32 hex chars
    }

    /** active 상태이고 만료되지 않았으면 true */
    public function isValid(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }
        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }
        return true;
    }
}
