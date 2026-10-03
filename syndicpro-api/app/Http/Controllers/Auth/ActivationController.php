<?php

namespace App\Http\Controllers\Auth;

use App\Enums\AccountStatus;
use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Services\OwnerAccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ActivationController extends Controller
{
    public function __construct(private OwnerAccountService $accounts) {}

    /** Le propriétaire choisit son mot de passe via le lien reçu (usage unique). */
    public function activate(Request $request, string $token): JsonResponse
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ], [
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
        ]);

        $user = $this->accounts->findByToken($token);

        if (! $user || ! $user->isPendingActivation()) {
            return ApiResponse::error('Lien d’activation invalide ou déjà utilisé.', 404);
        }

        if (! $user->activation_expires_at || $user->activation_expires_at->isPast()) {
            return ApiResponse::error('Lien d’activation expiré. Demandez au syndic un nouveau lien.', 422);
        }

        $user->forceFill([
            'password' => Hash::make($request->input('password')),
            'status' => AccountStatus::Active->value,
            'is_active' => true,
            'password_set_at' => now(),
            'activation_token_hash' => null,
            'activation_expires_at' => null,
            'failed_attempts' => 0,
            'locked_until' => null,
        ])->save();

        return ApiResponse::success(null, 'Compte activé. Vous pouvez vous connecter.');
    }
}
