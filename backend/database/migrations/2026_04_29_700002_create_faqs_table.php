<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->string('category');
            $table->text('question');
            $table->text('answer');
            $table->unsignedInteger('order_no')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
            $table->index(['category', 'order_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faqs');
    }
};
