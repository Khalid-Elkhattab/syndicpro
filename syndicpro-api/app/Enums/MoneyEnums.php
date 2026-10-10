<?php

namespace App\Enums;

/** Cotisations, dus mensuels, paiements, allocations. */
enum ContributionType: string
{
    use HasLabel;

    case Syndic = 'syndic';
    case Exceptional = 'exceptional';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Syndic => 'Syndic',
            self::Exceptional => 'Exceptionnelle',
        };
    }
}

enum CalculationMode: string
{
    use HasLabel;

    case Fixed = 'fixed';
    case PerSurface = 'per_surface';
    case Tantieme = 'tantieme';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Fixed => 'Forfaitaire',
            self::PerSurface => 'Par surface',
            self::Tantieme => 'Tantièmes',
        };
    }
}

enum ContributionStatus: string
{
    use HasLabel;

    case Draft = 'draft';
    case Published = 'published';
    case Cancelled = 'cancelled';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Draft => 'Brouillon',
            self::Published => 'Publiée',
            self::Cancelled => 'Annulée',
        };
    }
}

enum DueStatus: string
{
    use HasLabel;

    case Unpaid = 'unpaid';
    case Partial = 'partial';
    case Paid = 'paid';
    case Cancelled = 'cancelled';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Unpaid => 'Impayé',
            self::Partial => 'Partiel',
            self::Paid => 'Payé',
            self::Cancelled => 'Annulé',
        };
    }
}

enum PaymentMethod: string
{
    use HasLabel;

    case Cheque = 'cheque';
    case Transfer = 'transfer';
    case Deposit = 'deposit';
    case Cash = 'cash';
    case Effet = 'effet';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Cheque => 'Chèque',
            self::Transfer => 'Virement',
            self::Deposit => 'Versement',
            self::Cash => 'Espèces',
            self::Effet => 'Effet',
        };
    }

    public function requiresDocumentNumber(): bool
    {
        return in_array($this, [self::Cheque, self::Effet], true);
    }
}

enum PaymentStatus: string
{
    use HasLabel;

    case Pending = 'pending';
    case Validated = 'validated';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Pending => 'En attente',
            self::Validated => 'Validé',
            self::Rejected => 'Rejeté',
            self::Cancelled => 'Annulé',
        };
    }
}

enum PaymentSource: string
{
    use HasLabel;

    case BackOffice = 'back_office';
    case OwnerPortal = 'owner_portal';
    case Whatsapp = 'whatsapp';
    case Import = 'import';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::BackOffice => 'Back-office',
            self::OwnerPortal => 'Portail copropriétaire',
            self::Whatsapp => 'WhatsApp',
            self::Import => 'Import',
        };
    }
}

enum AllocationMode: string
{
    use HasLabel;

    case Auto = 'auto';
    case Manual = 'manual';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Auto => 'Automatique',
            self::Manual => 'Manuelle',
        };
    }
}
