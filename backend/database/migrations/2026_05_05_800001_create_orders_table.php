<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('offering_id')->nullable()->constrained('course_offerings')->nullOnDelete();

            $table->string('order_no')->unique()->comment('ORD-YYYYMMDD-NNNNNN');
            $table->unsignedInteger('amount');
            $table->enum('status', ['pending', 'paid', 'cancelled', 'refunded'])->default('pending');

            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            // 추후 PG 연동 시 사용
            $table->string('pg_provider')->nullable();
            $table->string('pg_transaction_id')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('course_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
