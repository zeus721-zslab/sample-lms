<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminInquiryController extends Controller
{
    /** Base64URL 인코딩 (JWT 표준: +→-, /→_, = 제거) */
    private function base64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /** 관리자 채팅 JWT 발급 */
    public function token(Request $request): JsonResponse
    {
        $secret  = config('app.chat_jwt_secret');
        $header  = $this->base64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = $this->base64url(json_encode([
            'userId'   => 'admin',
            'userType' => 'admin',
            'iat'      => time(),
            'exp'      => time() + 86400 * 7,
        ]));
        $sig   = hash_hmac('sha256', "{$header}.{$payload}", $secret, true);
        $token = "{$header}.{$payload}." . $this->base64url($sig);

        return response()->json(['token' => $token]);
    }

    /**
     * 1:1 문의 방 목록
     * — 가장 최근 메시지·미읽음 카운트·참여자(user) 정보 포함
     */
    public function index(Request $request): JsonResponse
    {
        $q = $request->query('q');

        $rooms = DB::table('chat_rooms as r')
            ->join('chat_participants as pu', function ($j) {
                $j->on('pu.room_id', '=', 'r.id')
                  ->where('pu.user_type', '=', 'user');
            })
            ->join('chat_participants as pa', function ($j) {
                $j->on('pa.room_id', '=', 'r.id')
                  ->where('pa.user_type', '=', 'admin');
            })
            ->leftJoin('chat_messages as lm', function ($j) {
                $j->on('lm.room_id', '=', 'r.id')
                  ->whereRaw('lm.id = (SELECT MAX(id) FROM chat_messages WHERE room_id = r.id)');
            })
            ->where('r.type', '1to1')
            ->select(
                'r.id', 'r.created_at',
                'pu.user_id',
                'pa.last_read_at as admin_last_read_at',
                'lm.message as last_message',
                'lm.created_at as last_message_at',
                'lm.sender_type as last_sender_type'
            )
            ->orderByDesc('lm.created_at')
            ->get();

        // user 정보 매핑
        $userIds = $rooms->pluck('user_id')->filter()->unique()->values();
        $users = User::whereIn('id', $userIds)->get()->keyBy('id');

        // 미읽음 카운트 (admin이 읽지 않은 user 메시지)
        $unreadCounts = DB::table('chat_messages as m')
            ->join('chat_participants as p', fn($j) => $j->on('p.room_id', '=', 'm.room_id')->where('p.user_type', '=', 'admin'))
            ->whereIn('m.room_id', $rooms->pluck('id'))
            ->where('m.sender_type', 'user')
            ->where(fn($q) => $q->whereRaw('m.created_at > p.last_read_at')->orWhereNull('p.last_read_at'))
            ->groupBy('m.room_id')
            ->select('m.room_id', DB::raw('COUNT(*) as cnt'))
            ->pluck('cnt', 'room_id');

        $result = $rooms->map(function ($room) use ($users, $unreadCounts, $q) {
            $user = $users->get($room->user_id);
            if ($q && $user && !str_contains(strtolower($user->name . $user->email), strtolower($q))) {
                return null;
            }
            return [
                'id'                => $room->id,
                'created_at'        => $room->created_at,
                'last_message'      => $room->last_message,
                'last_message_at'   => $room->last_message_at,
                'last_sender_type'  => $room->last_sender_type,
                'unread_count'      => $unreadCounts->get($room->id, 0),
                'user'              => $user ? ['id' => $user->id, 'name' => $user->name, 'email' => $user->email] : null,
            ];
        })->filter()->values();

        return response()->json($result);
    }
}
