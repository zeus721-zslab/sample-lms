<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->enum('course_type', ['credit_bank', 'certificate']);
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('thumbnail')->nullable();
            $table->unsignedSmallInteger('credit_hours')->nullable();
            $table->unsignedSmallInteger('total_lessons')->default(0);
            $table->unsignedInteger('price')->default(0);
            $table->foreignId('instructor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['draft', 'published', 'closed'])->default('draft');
            $table->enum('mode', ['semester', 'ondemand'])->default('ondemand');
            $table->timestamps();

            $table->index(['course_type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
