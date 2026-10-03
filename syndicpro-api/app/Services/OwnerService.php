<?php

namespace App\Services;

use App\Enums\OwnerType;
use App\Models\Owner;
use Illuminate\Support\Facades\DB;

/**
 * Spec §6 (owner file) : même CIN → même ligne (jamais de doublon).
 * Le CIN n’est pas une clé unique DB (soft deletes, cas sans CIN) : le service l’impose.
 */
class OwnerService
{
    public static function normalizeIdentity(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        return mb_strtoupper(preg_replace('/\s+/', '', trim($value)));
    }

    public function findOrCreate(array $data): Owner
    {
        $identity = self::normalizeIdentity($data['identity_number'] ?? null);

        if ($identity) {
            $existing = Owner::where('identity_number', $identity)->first();
            if ($existing) {
                return $existing;
            }
        }

        return DB::transaction(fn () => $this->create($data, $identity));
    }

    public function create(array $data, ?string $identity = null): Owner
    {
        $owner = Owner::create([
            'type' => $data['type'] ?? OwnerType::Individual->value,
            'first_name' => $data['first_name'] ?? null,
            'last_name' => $data['last_name'] ?? null,
            'company_name' => $data['company_name'] ?? null,
            'identity_number' => $identity ?? self::normalizeIdentity($data['identity_number'] ?? null),
            'preferred_locale' => $data['preferred_locale'] ?? 'fr',
            'internal_notes' => $data['internal_notes'] ?? null,
        ]);

        foreach ($data['phones'] ?? [] as $phone) {
            $owner->phones()->create([
                'number' => $phone['number'],
                'is_whatsapp' => $phone['is_whatsapp'] ?? false,
                'is_primary' => $phone['is_primary'] ?? false,
            ]);
        }

        foreach ($data['emails'] ?? [] as $email) {
            $owner->emails()->create([
                'email' => $email['email'],
                'is_primary' => $email['is_primary'] ?? false,
            ]);
        }

        return $owner;
    }
}
