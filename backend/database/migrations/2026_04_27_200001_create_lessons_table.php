<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->unsignedSmallInteger('chapter')->default(1);
            $table->unsignedSmallInteger('order_no')->default(1);
            $table->string('title');
            $table->string('video_url')->nullable();
            $table->unsignedInteger('duration_sec')->default(0);
            $table->json('materials')->nullable();
            $table->timestamps();

            $table->index(['course_id', 'chapter', 'order_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
