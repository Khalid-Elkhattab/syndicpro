<?php

namespace App\Http\Controllers\Auth;

use App\Enums\AccountStatus;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController
{
    /** Message unique : inconnu / faux mot de passe / inactif = même réponse (anti-énumération). */
    public const GENERIC_FAILURE = 'Identifiants incorrects.';

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('username', 'password');

        /** @var User|null $candidate */
        $candidate = User::where('username', $credentials['username'])->first();

        if ($candidate && $candidate->locked_until && $candidate->locked_until->isFuture()) {
            return ApiResponse::error(self::GENERIC_FAILURE, 401);
        }

        if (! Auth::guard('web')->attempt($credentials)) {
            $this->registerFailure($candidate);

            return ApiResponse::error(self::GENERIC_FAILURE, 401);
        }

        try {
            session()->regenerate();
        } catch (\RuntimeException $e) {
            // Session not available
        }

        /** @var User $user */
        $user = Auth::guard('web')->user();
        $status = $user->status instanceof AccountStatus
            ? $user->status->value
            : (string) $user->status;

        if (! $user->is_active || $user->isPendingActivation() || $status !== 'active') {
            Auth::guard('web')->logout();

            return ApiResponse::error(self::GENERIC_FAILURE, 401);
        }

        $user->forceFill([
            'failed_attempts' => 0,
            'locked_until' => null,
            'last_login_at' => now(),
        ])->save();

        return ApiResponse::success([
            'user' => new UserResource($user),
        ], 'Connexion réussie.');
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

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

    private function registerFailure(?User $candidate): void
    {
        if (! $candidate) {
            return;
        }

        $attempts = ((int) $candidate->failed_attempts) + 1;
        $candidate->forceFill([
            'failed_attempts' => $attempts,
            'locked_until' => $attempts >= 5 ? now()->addMinutes(15) : $candidate->locked_until,
        ])->save();
    }
}
