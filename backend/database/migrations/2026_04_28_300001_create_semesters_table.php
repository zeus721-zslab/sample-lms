<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('semesters', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('year');
            $table->enum('term', ['spring', 'summer', 'fall', 'winter']);
            $table->date('start_date');
            $table->date('end_date');
            $table->timestamp('enroll_start_at')->nullable();
            $table->timestamp('enroll_end_at')->nullable();
            $table->timestamp('class_start_at')->nullable();
            $table->timestamp('class_end_at')->nullable();
            $table->enum('status', ['planned', 'enrolling', 'active', 'closed'])->default('planned');
            $table->timestamps();

            $table->unique(['year', 'term']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semesters');
    }
};
