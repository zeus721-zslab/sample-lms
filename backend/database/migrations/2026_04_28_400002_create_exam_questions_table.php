<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('order_no')->default(1);
            $table->enum('type', ['single', 'multiple', 'short', 'essay'])->default('single');
            $table->text('body');
            $table->json('choices')->nullable();          // 객관식 보기 배열
            $table->json('correct_answer')->nullable();   // 정답 (객관식·단답)
            $table->unsignedInteger('score')->default(20);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_questions');
    }
};
