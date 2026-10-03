<?php

namespace App\Services;

use App\Enums\InquiryStatus;
use App\Enums\InquiryType;
use App\Models\Inquiry;
use App\Notifications\NewInquiryNotification;
use Illuminate\Support\Facades\Notification;

/**
 * Demandes du site public (contact + démo). Contrôleurs fins :
 * valider, appeler le service, répondre.
 */
class InquiryService
{
    /**
     * @param array{
     *   type: string, name: string, email?: ?string, phone?: ?string,
     *   message?: ?string, details?: ?array, locale?: ?string, ip?: ?string
     * } $data
     */
    public function store(array $data): Inquiry
    {
        $inquiry = Inquiry::create([
            'type' => $data['type'],
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'message' => $data['message'] ?? null,
            'details' => array_merge($data['details'] ?? [], [
                'locale' => $data['locale'] ?? 'fr',
                'consent_at' => now()->toIso8601String(),
            ]),
            'status' => InquiryStatus::New->value,
            'ip' => $data['ip'] ?? null,
        ]);

        $recipients = config('site.demo_recipients', []);
        if ($recipients !== []) {
            Notification::route('mail', $recipients)->notify(
                (new NewInquiryNotification($inquiry))->afterCommit()
            );
        }

        return $inquiry;
    }

    public function typeLabel(Inquiry $inquiry): string
    {
        $type = $inquiry->type instanceof InquiryType
            ? $inquiry->type
            : InquiryType::tryFrom((string) $inquiry->type);

        return $type instanceof InquiryType ? $type->label() : (string) $inquiry->type;
    }
}
