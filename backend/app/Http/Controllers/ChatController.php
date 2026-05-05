<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    /** Base64URL 인코딩 (JWT 표준: +→-, /→_, = 제거) */
    private function base64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function generateChatToken(string $userId, string $userType = 'user'): string
    {
        $secret  = config('app.chat_jwt_secret');
        $header  = $this->base64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = $this->base64url(json_encode([
            'userId'   => $userId,
            'userType' => $userType,
            'iat'      => time(),
            'exp'      => time() + 86400 * 7,
        ]));
        $sig = hash_hmac('sha256', "{$header}.{$payload}", $secret, true);
        return "{$header}.{$payload}." . $this->base64url($sig);
    }

    /** POST /api/chat/token */
    public function token(Request $request): JsonResponse
    {
        $user = $request->user();
        $token = $this->generateChatToken((string) $user->id, 'user');
        return response()->json(['token' => $token]);
    }

    /** POST /api/chat/rooms  — 1:1 방 findOrCreate (user ↔ 'admin' placeholder) */
    public function createRoom(Request $request): JsonResponse
    {
        $user = $request->user();
        $adminId = 'admin'; // chat server 측 admin placeholder

        // find existing
        $room = DB::table('chat_rooms as r')
            ->join('chat_participants as pa', fn($j) => $j->on('pa.room_id', '=', 'r.id')->where('pa.user_id', '=', (string) $user->id))
            ->join('chat_participants as pb', fn($j) => $j->on('pb.room_id', '=', 'r.id')->where('pb.user_id', '=', $adminId))
            ->where('r.type', '1to1')
            ->select('r.*')
            ->first();

        if (!$room) {
            $roomId = DB::table('chat_rooms')->insertGetId([
                'type'       => '1to1',
                'created_at' => now(),
            ]);
            DB::table('chat_participants')->insert([
                ['room_id' => $roomId, 'user_id' => (string) $user->id, 'user_type' => 'user',  'joined_at' => now()],
                ['room_id' => $roomId, 'user_id' => $adminId,           'user_type' => 'admin', 'joined_at' => now()],
            ]);
            $room = DB::table('chat_rooms')->where('id', $roomId)->first();
        }

        return response()->json($room, 201);
    }

    /** GET /api/chat/rooms/{id}/messages */
    public function messages(Request $request, int $roomId): JsonResponse
    {
        $user = $request->user();
        // 본인 참여 확인
        $isParticipant = DB::table('chat_participants')
            ->where('room_id', $roomId)
            ->where('user_id', (string) $user->id)
            ->exists();

        if (!$isParticipant) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $messages = DB::table('chat_messages')
            ->where('room_id', $roomId)
            ->orderBy('created_at', 'asc')
            ->limit(100)
            ->get();

        return response()->json($messages);
    }

    /** GET /api/chat/unread */
    public function unread(Request $request): JsonResponse
    {
        $user = $request->user();
        $userId = (string) $user->id;

        // 참여 중인 방에서 내 last_read_at 이후 메시지 수
        $count = DB::table('chat_messages as m')
            ->join('chat_participants as p', function ($j) use ($userId) {
                $j->on('p.room_id', '=', 'm.room_id')
                  ->where('p.user_id', '=', $userId);
            })
            ->where('m.sender_id', '!=', $userId)
            ->where(function ($q) {
                $q->whereRaw('m.created_at > p.last_read_at')
                  ->orWhereNull('p.last_read_at');
            })
            ->count();

        return response()->json(['unread' => $count]);
    }
}
