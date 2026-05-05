<?php

return [
    /*
    |--------------------------------------------------------------------------
    | 단일 세션 강제 여부
    |--------------------------------------------------------------------------
    | true  : 동시접속 기본 차단 (allow_concurrent_session=true인 사용자 예외)
    | false : 동시접속 무조건 허용
    */
    'single_session_enforce' => env('SINGLE_SESSION_ENFORCE', true),

    /*
    |--------------------------------------------------------------------------
    | zslab-chat 내부 통신
    |--------------------------------------------------------------------------
    */
    'chat_internal_url'    => env('CHAT_INTERNAL_URL', 'http://lms_chat:3002'),
    'chat_internal_secret' => env('CHAT_INTERNAL_SECRET', ''),
];
