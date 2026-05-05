<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\Order;
use App\Services\Payment\PaymentGatewayInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function __construct(
        private readonly PaymentGatewayInterface $payment,
    ) {}

    /**
     * POST /api/orders
     * body: { course_id } 또는 { course_id, offering_id }
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'course_id'   => ['required', 'integer', 'exists:courses,id'],
            'offering_id' => ['nullable', 'integer', 'exists:course_offerings,id'],
        ]);

        $user   = $request->user();
        $course = Course::published()->findOrFail($data['course_id']);

        // 이미 수강 중 확인
        $existsQuery = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->whereNotIn('status', ['withdrawn']);

        if (!empty($data['offering_id'])) {
            $existsQuery->where('offering_id', $data['offering_id']);
        }

        if ($existsQuery->exists()) {
            return response()->json([
                'message' => '이미 수강 중인 강좌입니다.',
                'code'    => 'ALREADY_ENROLLED',
            ], 422);
        }

        // 무료 코스 — 결제 없이 바로 enrollment
        if ($course->price === 0) {
            $enrollment = Enrollment::create([
                'user_id'     => $user->id,
                'course_id'   => $course->id,
                'offering_id' => $data['offering_id'] ?? null,
                'status'      => 'studying',
                'enrolled_at' => now(),
            ]);

            return response()->json([
                'free'       => true,
                'enrollment' => $enrollment->load('course:id,title,slug,course_type,price'),
            ], 201);
        }

        // 유료 코스 — order 생성 → 결제 → enrollment
        $result = DB::transaction(function () use ($user, $course, $data) {
            // order 생성 (order_no 임시)
            $order = Order::create([
                'user_id'     => $user->id,
                'course_id'   => $course->id,
                'offering_id' => $data['offering_id'] ?? null,
                'order_no'    => 'TEMP-' . uniqid(),
                'amount'      => $course->price,
                'status'      => 'pending',
            ]);

            // order_no 확정 (ID 기반)
            $order->update([
                'order_no' => 'ORD-' . now()->format('Ymd') . '-' . str_pad((string) $order->id, 6, '0', STR_PAD_LEFT),
            ]);

            // 결제 승인 (Stub: 즉시 true)
            $charged = $this->payment->charge($order);

            if (!$charged) {
                throw new \RuntimeException('결제 처리에 실패했습니다.');
            }

            $order->update([
                'status'  => 'paid',
                'paid_at' => now(),
            ]);

            // enrollment 생성
            $enrollment = Enrollment::create([
                'user_id'     => $user->id,
                'course_id'   => $course->id,
                'offering_id' => $data['offering_id'] ?? null,
                'status'      => 'studying',
                'enrolled_at' => now(),
            ]);

            return compact('order', 'enrollment');
        });

        return response()->json([
            'free'       => false,
            'order'      => $result['order']->load('course:id,title,slug,course_type,price'),
            'enrollment' => $result['enrollment']->load('course:id,title,slug,course_type,price'),
        ], 201);
    }

    /**
     * GET /api/orders/my
     */
    public function myList(Request $request): JsonResponse
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with('course:id,title,slug,course_type,thumbnail,price')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($orders);
    }

    /**
     * POST /api/orders/{id}/cancel
     * paid → refunded, enrollment → withdrawn
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $user  = $request->user();
        $order = Order::where('user_id', $user->id)
            ->where('status', 'paid')
            ->findOrFail($id);

        DB::transaction(function () use ($order, $user) {
            $refunded = $this->payment->refund($order);

            if (!$refunded) {
                throw new \RuntimeException('환불 처리에 실패했습니다.');
            }

            $order->update([
                'status'       => 'refunded',
                'cancelled_at' => now(),
            ]);

            // 관련 enrollment withdrawn
            $query = Enrollment::where('user_id', $user->id)
                ->where('course_id', $order->course_id)
                ->whereNotIn('status', ['withdrawn']);

            if ($order->offering_id) {
                $query->where('offering_id', $order->offering_id);
            }

            $query->update(['status' => 'withdrawn']);

            // 학점은행 — 정원 복원
            if ($order->offering_id) {
                $offering = CourseOffering::lockForUpdate()->find($order->offering_id);
                if ($offering) {
                    $newCount  = max(0, $offering->current_students - 1);
                    $newStatus = ($offering->status === 'full' && $newCount < $offering->max_students)
                        ? 'open' : $offering->status;
                    $offering->update([
                        'current_students' => $newCount,
                        'status'           => $newStatus,
                    ]);
                }
            }
        });

        return response()->json(['message' => '취소 및 환불이 완료되었습니다.']);
    }
}
