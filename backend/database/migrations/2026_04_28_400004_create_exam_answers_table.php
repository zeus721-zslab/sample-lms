<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')
                ->constrained('exam_submissions')
                ->cascadeOnDelete();
            $table->foreignId('question_id')
                ->constrained('exam_questions')
                ->cascadeOnDelete();
            $table->json('answer');                    // 제출 답안
            $table->unsignedInteger('score')->nullable();
            $table->foreignId('graded_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->dateTime('graded_at')->nullable();
            $table->timestamps();

            $table->unique(['submission_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_answers');
    }
};
