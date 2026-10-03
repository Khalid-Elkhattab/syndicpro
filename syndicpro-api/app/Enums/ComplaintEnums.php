<?php

namespace App\Enums;

/** Réclamations. */
enum ComplaintStatus: string
{
    use HasLabel;

    case New = 'new';
    case InProgress = 'in_progress';
    case Resolved = 'resolved';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::New => 'Nouveau',
            self::InProgress => 'En cours',
            self::Resolved => 'Résolu',
        };
    }
}

enum ComplaintSource: string
{
    use HasLabel;

    case Staff = 'staff';
    case OwnerPortal = 'owner_portal';
    case Whatsapp = 'whatsapp';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Staff => 'Staff',
            self::OwnerPortal => 'Portail copropriétaire',
            self::Whatsapp => 'WhatsApp',
        };
    }
}

enum ComplaintPriority: string
{
    use HasLabel;

    case Low = 'low';
    case Normal = 'normal';
    case Urgent = 'urgent';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Low => 'Basse',
            self::Normal => 'Normale',
            self::Urgent => 'Urgente',
        };
    }
}

enum AuthorType: string
{
    use HasLabel;

    case Staff = 'staff';
    case Owner = 'owner';
    case Bot = 'bot';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Staff => 'Staff',
            self::Owner => 'Copropriétaire',
            self::Bot => 'Robot',
        };
    }
}
