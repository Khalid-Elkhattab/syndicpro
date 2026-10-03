<?php

namespace App\Services;

use App\Enums\AccountStatus;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Comptes copropriétaires : initialisation par lien d’activation (jamais de mot de
 * passe saisi par quelqu’un d’autre). Le token est stocké hashé, usage unique, 7 jours.
 * newplan.md F0.
 */
class OwnerAccountService
{
    public const ACTIVATION_TTL_DAYS = 7;

    /**
     * Passe le compte en attente d’activation et émet un lien.
     *
     * @return array{token: string, expires_at: Carbon}
     */
    public function issueActivation(User $user): array
    {
        $token = Str::random(48);

        $user->forceFill([
            'password' => Hash::make(Str::random(40)),
            'status' => AccountStatus::PendingActivation->value,
            'is_active' => true,
            'activation_token_hash' => hash('sha256', $token),
            'activation_expires_at' => now()->addDays(self::ACTIVATION_TTL_DAYS),
            'password_set_at' => null,
        ])->save();

        // TODO F11 : envoi WhatsApp (template) + fallback email. En attendant : log.
        Log::info('Activation link issued', [
            'user_id' => $user->id,
            'username' => $user->username,
            'expires_at' => $user->activation_expires_at,
        ]);

        return ['token' => $token, 'expires_at' => $user->activation_expires_at];
    }

    public function findByToken(string $token): ?User
    {
        $hash = hash('sha256', $token);

        return User::where('activation_token_hash', $hash)->first();
    }
}
