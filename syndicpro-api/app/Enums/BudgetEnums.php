<?php

namespace App\Enums;

/** Budgets, dépenses, trésorerie, exercices, bâtiments. */
enum FiscalYearStatus: string
{
    use HasLabel;

    case Open = 'open';
    case Closed = 'closed';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Open => 'Ouvert',
            self::Closed => 'Clôturé',
        };
    }
}

enum ParkingStatus: string
{
    use HasLabel;

    case Yes = 'yes';
    case No = 'no';
    case Common = 'common';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Yes => 'Oui',
            self::No => 'Non',
            self::Common => 'Commun',
        };
    }
}

enum AnnexType: string
{
    use HasLabel;

    case Parking = 'parking';
    case Box = 'box';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Parking => 'Parking',
            self::Box => 'Box',
        };
    }
}

enum BudgetType: string
{
    use HasLabel;

    case Forecast = 'forecast';
    case OffBudget = 'off_budget';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Forecast => 'Prévisionnel',
            self::OffBudget => 'Hors budget',
        };
    }
}

enum BudgetKind: string
{
    use HasLabel;

    case Operating = 'operating';
    case Investment = 'investment';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Operating => 'Fonctionnement',
            self::Investment => 'Investissement',
        };
    }
}

enum BudgetStatus: string
{
    use HasLabel;

    case Draft = 'draft';
    case Approved = 'approved';
    case Closed = 'closed';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Draft => 'Brouillon',
            self::Approved => 'Approuvé',
            self::Closed => 'Clôturé',
        };
    }
}

enum ExpenseKind: string
{
    use HasLabel;

    case Expense = 'expense';
    case Intervention = 'intervention';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Expense => 'Dépense',
            self::Intervention => 'Intervention',
        };
    }
}

enum ExpenseStatus: string
{
    use HasLabel;

    case Recorded = 'recorded';
    case Paid = 'paid';
    case Cancelled = 'cancelled';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Recorded => 'Enregistrée',
            self::Paid => 'Payée',
            self::Cancelled => 'Annulée',
        };
    }
}

enum TreasuryStatus: string
{
    use HasLabel;

    case Draft = 'draft';
    case Validated = 'validated';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Draft => 'Brouillon',
            self::Validated => 'Validé',
        };
    }
}
