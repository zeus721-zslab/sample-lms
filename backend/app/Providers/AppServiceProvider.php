<?php

namespace App\Providers;

use App\Models\Course;
use App\Observers\CourseObserver;
use App\Services\Payment\PaymentGatewayInterface;
use App\Services\Payment\StubPaymentGateway;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // 결제는 MVP stub — 운영 시 PG 연동 필요.
        // StubPaymentGateway → 실제 PG 클래스(e.g. TossPaymentGateway)로 교체.
        $this->app->bind(PaymentGatewayInterface::class, StubPaymentGateway::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Course::observe(CourseObserver::class);
    }
}
