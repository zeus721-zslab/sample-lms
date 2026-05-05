<?php

namespace App\Services\Payment;

use App\Models\Order;

interface PaymentGatewayInterface
{
    /**
     * 결제 승인 요청.
     * 성공 시 true, 실패 시 false 반환.
     */
    public function charge(Order $order): bool;

    /**
     * 환불 요청.
     * 성공 시 true, 실패 시 false 반환.
     */
    public function refund(Order $order): bool;
}
