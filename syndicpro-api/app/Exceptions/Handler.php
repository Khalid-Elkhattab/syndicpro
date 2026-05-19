<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Routing\Exceptions\ThrottleRequestsException;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    public function render($request, Throwable $e): \Illuminate\Http\Response|\Illuminate\Http\JsonResponse|\Symfony\Component\HttpFoundation\Response
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return $this->handleApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    private function handleApiException($request, Throwable $e): JsonResponse
    {
        if ($e instanceof ValidationException) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Les données soumises sont invalides.',
                'errors' => $e->errors(),
            ], 422);
        }

        if ($e instanceof ModelNotFoundException) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Ressource introuvable.',
            ], 404);
        }

        if ($e instanceof AuthorizationException) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Accès non autorisé.',
            ], 403);
        }

        if ($e instanceof AuthenticationException) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Non authentifié.',
            ], 401);
        }

        if ($e instanceof ThrottleRequestsException) {
            $seconds = $e->getHeaders()['Retry-After'] ?? 60;
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => "Trop de tentatives. Réessayez dans {$seconds} secondes.",
            ], 429);
        }

        // Generic exception - hide details in production
        $message = config('app.debug') 
            ? $e->getMessage() 
            : 'Une erreur inattendue s\'est produite.';

        return response()->json([
            'success' => false,
            'data' => null,
            'message' => $message,
        ], 500);
    }
}