<?php

namespace App\Enums;

/** Propriétaires, propriété des lots, demandes d’accès, quitus. */
enum OwnerType: string
{
    use HasLabel;

    case Individual = 'individual';
    case Company = 'company';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Individual => 'Particulier',
            self::Company => 'Société',
        };
    }
}

enum OwnershipChangeReason: string
{
    use HasLabel;

    case Initial = 'initial';
    case PromoterSale = 'promoter_sale';
    case Sale = 'sale';
    case Inheritance = 'inheritance';
    case Donation = 'donation';
    case Other = 'other';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Initial => 'Initial',
            self::PromoterSale => 'Première vente (promoteur)',
            self::Sale => 'Vente',
            self::Inheritance => 'Héritage',
            self::Donation => 'Donation',
            self::Other => 'Autre',
        };
    }
}

enum AccountRequestStatus: string
{
    use HasLabel;

    case Submitted = 'submitted';
    case NeedsInfo = 'needs_info';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Submitted => 'Soumise',
            self::NeedsInfo => 'Complément demandé',
            self::Approved => 'Approuvée',
            self::Rejected => 'Rejetée',
        };
    }
}

enum AccountMatchResult: string
{
    use HasLabel;

    case Exact = 'exact';
    case OwnedByPromoter = 'owned_by_promoter';
    case NoOwnerOnRecord = 'no_owner_on_record';
    case DifferentOwner = 'different_owner';
    case LotNotFound = 'lot_not_found';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Exact => 'Correspond au propriétaire',
            self::OwnedByPromoter => 'Lot du promoteur (première vente)',
            self::NoOwnerOnRecord => 'Aucun propriétaire enregistré',
            self::DifferentOwner => 'Autre propriétaire (revente)',
            self::LotNotFound => 'Lot introuvable',
        };
    }
}

enum QuitusPurpose: string
{
    use HasLabel;

    case Sale = 'sale';
    case FiscalYear = 'fiscal_year';
    case Other = 'other';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Sale => 'Vente',
            self::FiscalYear => 'Exercice',
            self::Other => 'Autre',
        };
    }
}

enum QuitusStatus: string
{
    use HasLabel;

    case Valid = 'valid';
    case Used = 'used';
    case Expired = 'expired';
    case Cancelled = 'cancelled';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Valid => 'Valide',
            self::Used => 'Utilisé',
            self::Expired => 'Expiré',
            self::Cancelled => 'Annulé',
        };
    }
}

/** Statut de vente d’un lot — TOUJOURS calculé, jamais stocké. */
enum SaleStatus: string
{
    use HasLabel;

    case Unsold = 'unsold';
    case Sold = 'sold';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Unsold => 'Non vendu',
            self::Sold => 'Vendu',
        };
    }
}
