<?php

namespace App\Enums;

/** Documents officiels, modèles, annonces, ventes. */
enum DocumentType: string
{
    use HasLabel;

    case Receipt = 'receipt';
    case FundCall = 'fund_call';
    case OwnerStatement = 'owner_statement';
    case UnpaidStatement = 'unpaid_statement';
    case ResidenceStatement = 'residence_statement';
    case Reminder = 'reminder';
    case FormalNotice = 'formal_notice';
    case LawyerList = 'lawyer_list';
    case AssemblyNotice = 'assembly_notice';
    case AttendanceList = 'attendance_list';
    case AssemblyMinutes = 'assembly_minutes';
    case Quitus = 'quitus';
    case FinancialReport = 'financial_report';
    case MoralReport = 'moral_report';
    case BudgetForecast = 'budget_forecast';
    case ExpenseStatement = 'expense_statement';
    case BudgetVsActual = 'budget_vs_actual';
    case TreasuryStatement = 'treasury_statement';
    case Note = 'note';
    case Information = 'information';
    case SaleContract = 'sale_contract';
    case Regulation = 'regulation';
    case Other = 'other';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Receipt => 'Reçu de paiement',
            self::FundCall => 'Appel de fonds',
            self::OwnerStatement => 'Situation copropriétaire',
            self::UnpaidStatement => 'Situation des impayés',
            self::ResidenceStatement => 'Situation par résidence',
            self::Reminder => 'Rappel de paiement',
            self::FormalNotice => 'Mise en demeure',
            self::LawyerList => 'Liste pour avocat',
            self::AssemblyNotice => 'Convocation AG',
            self::AttendanceList => 'Feuille de présence',
            self::AssemblyMinutes => 'PV AG',
            self::Quitus => 'Quitus (إبراء الذمة)',
            self::FinancialReport => 'Rapport financier',
            self::MoralReport => 'Rapport moral',
            self::BudgetForecast => 'Budget prévisionnel',
            self::ExpenseStatement => 'Relevé des dépenses',
            self::BudgetVsActual => 'Budget vs réalisé',
            self::TreasuryStatement => 'Relevé de trésorerie',
            self::Note => 'Note',
            self::Information => 'Information',
            self::SaleContract => 'Contrat de vente',
            self::Regulation => 'Règlement',
            self::Other => 'Autre',
        };
    }
}

enum DocumentSource: string
{
    use HasLabel;

    case Generated = 'generated';
    case Uploaded = 'uploaded';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Generated => 'Généré',
            self::Uploaded => 'Téléversé',
        };
    }
}

enum DocumentStatus: string
{
    use HasLabel;

    case Draft = 'draft';
    case Final = 'final';
    case Superseded = 'superseded';
    case Cancelled = 'cancelled';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Draft => 'Brouillon',
            self::Final => 'Final',
            self::Superseded => 'Remplacé',
            self::Cancelled => 'Annulé',
        };
    }
}

enum AnnouncementKind: string
{
    use HasLabel;

    case Note = 'note';
    case Information = 'information';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Note => 'Note',
            self::Information => 'Information',
        };
    }
}

enum DocumentVisibility: string
{
    use HasLabel;

    case Staff = 'staff';
    case Owner = 'owner';
    case Residence = 'residence';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Staff => 'Staff',
            self::Owner => 'Copropriétaire',
            self::Residence => 'Résidence',
        };
    }
}

enum ArrearsOnSale: string
{
    use HasLabel;

    case SellerPays = 'seller_pays';
    case BuyerPays = 'buyer_pays';
    case Manual = 'manual';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::SellerPays => 'Vendeur paie (quitus exigé)',
            self::BuyerPays => 'Acquéreur paie',
            self::Manual => 'Manuel',
        };
    }
}
