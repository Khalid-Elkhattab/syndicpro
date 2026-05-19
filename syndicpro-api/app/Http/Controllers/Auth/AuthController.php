<?php

namespace App\Http\Controllers\Auth;

use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController
{
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('username', 'password');

        if (!Auth::attempt($credentials)) {
            return ApiResponse::error('Identifiants incorrects.', 401);
        }

        try {
            session()->regenerate();
        } catch (\RuntimeException $e) {
            // Session not available
        }

        $user = Auth::user();

        if (!$user->is_active) {
            Auth::logout();
            return ApiResponse::error('Votre compte est désactivé.', 403);
        }

        return ApiResponse::success([
            'user' => new UserResource($user),
        ], 'Connexion réussie.');
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();

        try {
            session()->invalidate();
            session()->regenerateToken();
        } catch (\RuntimeException $e) {
            // Session not available
        }

        return ApiResponse::success(null, 'Déconnexion réussie.');
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success(new UserResource($request->user()));
    }
}