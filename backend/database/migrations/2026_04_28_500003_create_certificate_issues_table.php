<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('certificate_id')->constrained('certificates')->cascadeOnDelete();
            $table->foreignId('enrollment_id')->nullable()->constrained('enrollments')->nullOnDelete();
            $table->string('serial_no')->unique();          // ZSLAB-YYYY-NNNNNN
            $table->string('verify_token', 32)->unique();   // 32자 랜덤 hex
            $table->timestamp('issued_at');
            $table->timestamp('expires_at')->nullable();
            $table->string('pdf_path')->nullable();
            $table->enum('status', ['active', 'revoked'])->default('active');
            $table->timestamp('revoked_at')->nullable();
            $table->string('revoked_reason')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_issues');
    }
};
