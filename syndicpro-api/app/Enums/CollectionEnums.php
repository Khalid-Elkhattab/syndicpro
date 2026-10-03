<?php

namespace App\Enums;

/** Recouvrement : relances, mises en demeure, avocat, canaux. */
enum CollectionActionType: string
{
    use HasLabel;

    case Reminder = 'reminder';
    case FormalNotice = 'formal_notice';
    case LawyerReferral = 'lawyer_referral';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Reminder => 'Rappel',
            self::FormalNotice => 'Mise en demeure',
            self::LawyerReferral => 'Transmission avocat',
        };
    }
}

enum NotificationChannel: string
{
    use HasLabel;

    case Whatsapp = 'whatsapp';
    case Email = 'email';
    case Letter = 'letter';
    case Sms = 'sms';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Whatsapp => 'WhatsApp',
            self::Email => 'Email',
            self::Letter => 'Courrier',
            self::Sms => 'SMS',
        };
    }
}

enum DeliveryStatus: string
{
    use HasLabel;

    case Queued = 'queued';
    case Sent = 'sent';
    case Delivered = 'delivered';
    case Failed = 'failed';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Queued => 'En file',
            self::Sent => 'Envoyé',
            self::Delivered => 'Reçu',
            self::Failed => 'Échec',
        };
    }
}

enum LawyerCaseStatus: string
{
    use HasLabel;

    case ToTransmit = 'to_transmit';
    case Transmitted = 'transmitted';
    case InProgress = 'in_progress';
    case Closed = 'closed';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::ToTransmit => 'À transmettre',
            self::Transmitted => 'Transmis',
            self::InProgress => 'En cours',
            self::Closed => 'Clôturé',
        };
    }
}
