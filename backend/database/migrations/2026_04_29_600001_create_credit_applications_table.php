<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->cascadeOnDelete();
            $table->timestamp('applied_at')->useCurrent();
            $table->enum('status', [
                'requested',
                'processing',
                'submitted_to_nile',
                'approved',
                'rejected',
            ])->default('requested');
            $table->text('note')->nullable();
            $table->timestamp('nile_submitted_at')->nullable();
            $table->timestamp('result_received_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('semester_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_applications');
    }
};
