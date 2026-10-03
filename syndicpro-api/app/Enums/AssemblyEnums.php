<?php

namespace App\Enums;

/** Assemblées générales : convocation, présence, votes. */
enum AssemblyType: string
{
    use HasLabel;

    case Ordinary = 'ordinary';
    case Extraordinary = 'extraordinary';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Ordinary => 'Ordinaire',
            self::Extraordinary => 'Extraordinaire',
        };
    }
}

enum AssemblyStatus: string
{
    use HasLabel;

    case Draft = 'draft';
    case Convened = 'convened';
    case Held = 'held';
    case Closed = 'closed';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Draft => 'Brouillon',
            self::Convened => 'Convoquée',
            self::Held => 'Tenue',
            self::Closed => 'Clôturée',
        };
    }
}

enum AttendanceType: string
{
    use HasLabel;

    case Present = 'present';
    case Represented = 'represented';
    case Absent = 'absent';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Present => 'Présent',
            self::Represented => 'Représenté',
            self::Absent => 'Absent',
        };
    }
}

enum MajorityRule: string
{
    use HasLabel;

    case Simple = 'simple';
    case TwoThirds = 'two_thirds';
    case Unanimity = 'unanimity';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Simple => 'Majorité simple',
            self::TwoThirds => 'Deux tiers',
            self::Unanimity => 'Unanimité',
        };
    }
}

enum ResolutionResult: string
{
    use HasLabel;

    case Pending = 'pending';
    case Adopted = 'adopted';
    case Rejected = 'rejected';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Pending => 'En attente',
            self::Adopted => 'Adoptée',
            self::Rejected => 'Rejetée',
        };
    }
}

enum VoteChoice: string
{
    use HasLabel;

    case For = 'for';
    case Against = 'against';
    case Abstain = 'abstain';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::For => 'Pour',
            self::Against => 'Contre',
            self::Abstain => 'Abstention',
        };
    }
}
