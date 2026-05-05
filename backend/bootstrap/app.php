<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);
        // login 네임드 라우트 없음 → 미인증 시 리다이렉트 대신 JSON 401 반환
        $middleware->redirectGuestsTo('/api/unauthorized');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // API 요청 미인증 → JSON 401
        $exceptions->render(function (
            \Illuminate\Auth\AuthenticationException $e,
            \Illuminate\Http\Request $request
        ) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });
    })->create();
