<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Order;
use App\Services\Payment\PaymentGatewayInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminOrderController extends Controller
{
    public function __construct(
        private readonly PaymentGatewayInterface $payment,
    ) {}

    /**
     * GET /api/admin/orders
     * 쿼리: status, user_id, date_from(Y-m-d), date_to(Y-m-d), page
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with([
            'user:id,name,email',
            'course:id,title,slug,course_type',
        ])->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $orders = $query->paginate(20);

        return response()->json([
            'data'         => $orders->items(),
            'total'        => $orders->total(),
            'current_page' => $orders->currentPage(),
            'last_page'    => $orders->lastPage(),
            'per_page'     => $orders->perPage(),
        ]);
    }

    /**
     * POST /api/admin/orders/{id}/refund
     */
    public function refund(Request $request, int $id): JsonResponse
    {
        $order = Order::where('status', 'paid')->findOrFail($id);

        DB::transaction(function () use ($order) {
            $refunded = $this->payment->refund($order);

            if (!$refunded) {
                throw new \RuntimeException('환불 처리에 실패했습니다.');
            }

            $order->update([
                'status'       => 'refunded',
                'cancelled_at' => now(),
            ]);

            // 관련 enrollment withdrawn
            $query = Enrollment::where('user_id', $order->user_id)
                ->where('course_id', $order->course_id)
                ->whereNotIn('status', ['withdrawn']);

            if ($order->offering_id) {
                $query->where('offering_id', $order->offering_id);
            }

            $query->update(['status' => 'withdrawn']);
        });

        return response()->json([
            'message' => '환불 처리가 완료되었습니다.',
            'order'   => $order->fresh(['user:id,name,email', 'course:id,title,slug']),
        ]);
    }
}
