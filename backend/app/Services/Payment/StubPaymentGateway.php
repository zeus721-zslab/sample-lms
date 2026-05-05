<?php

namespace App\Services\Payment;

use App\Models\Order;

/**
 * 결제는 MVP stub — 운영 시 PG 연동 필요.
 * PaymentGatewayInterface를 구현하는 실제 PG 클래스로 교체하면 됩니다.
 */
class StubPaymentGateway implements PaymentGatewayInterface
{
    /**
     * 즉시 승인 (sleep(1) 옵션 — 실제 PG 지연 시뮬레이션).
     * 운영 시 PG SDK 호출로 대체.
     */
    public function charge(Order $order): bool
    {
        // sleep(1); // 필요 시 주석 해제
        return true;
    }

    /**
     * 즉시 환불 승인.
     * 운영 시 PG 환불 API 호출로 대체.
     */
    public function refund(Order $order): bool
    {
        return true;
    }
}
