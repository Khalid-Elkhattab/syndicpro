<?php

namespace App\Services;

use App\Models\PhoneVerification;
use App\Rules\E164Phone;
use Illuminate\Support\Facades\Hash;

/**
 * Codes à usage unique pour le formulaire public (10 min, verrou après 5 erreurs).
 * Envoi réel via provider SMS/WhatsApp en F11 — en attendant : log (dev) + code
 * retourné uniquement aux tests.
 */
class PhoneVerificationService
{
    public const TTL_MINUTES = 10;

    public function send(string $phone, string $purpose, ?string $ip = null): PhoneVerification
    {
        $phone = E164Phone::normalize($phone);
        $code = (string) random_int(100000, 999999);

        $verification = PhoneVerification::create([
            'phone' => $phone,
            'purpose' => $purpose,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(self::TTL_MINUTES),
            'ip' => $ip,
        ]);

        \Illuminate\Support\Facades\Log::info('Phone verification code', [
            'id' => $verification->id, 'phone' => $phone, 'code' => $code,
        ]);

        // TODO F11 : envoi via le provider (jamais en réponse HTTP en production).
        if (app()->environment('testing')) {
            $verification->forceFill(['code_hash' => 'test:' . $code])->save();
        }

        return $verification;
    }

    public function verify(string $phone, string $code): bool
    {
        $phone = E164Phone::normalize($phone);

        $verification = PhoneVerification::where('phone', $phone)
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (! $verification || $verification->isExpired() || $verification->isLocked()) {
            return false;
        }

        $valid = str_starts_with($verification->code_hash, 'test:')
            ? hash_equals(substr($verification->code_hash, 5), trim($code))
            : \Illuminate\Support\Facades\Hash::check(trim($code), $verification->code_hash);

        if (! $valid) {
            $verification->increment('attempts');

            return false;
        }

        $verification->update(['verified_at' => now()]);

        return true;
    }

    public function isVerified(string $phone): bool
    {
        $phone = E164Phone::normalize($phone);

        return PhoneVerification::where('phone', $phone)
            ->whereNotNull('verified_at')
            ->where('verified_at', '>=', now()->subMinutes(self::TTL_MINUTES))
            ->exists();
    }
}
