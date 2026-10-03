<?php

namespace App\Enums;

/** Comptes du tableau `users` (staff + logins copropriétaires, un seul guard). */
enum UserType: string
{
    use HasLabel;

    case Staff = 'staff';
    case Owner = 'owner';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Staff => 'Staff',
            self::Owner => 'Copropriétaire',
        };
    }
}

enum StaffRole: string
{
    use HasLabel;

    case SuperAdmin = 'super_admin';
    case Syndic = 'syndic';
    case Assistant = 'assistant';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super admin',
            self::Syndic => 'Syndic',
            self::Assistant => 'Assistant',
        };
    }
}

enum AccountStatus: string
{
    use HasLabel;

    case PendingActivation = 'pending_activation';
    case Active = 'active';
    case Suspended = 'suspended';
    case Closed = 'closed';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::PendingActivation => 'En attente d’activation',
            self::Active => 'Actif',
            self::Suspended => 'Suspendu',
            self::Closed => 'Clôturé',
        };
    }
}

enum AccountEventType: string
{
    use HasLabel;

    case Created = 'created';
    case ActivationLinkIssued = 'activation_link_issued';
    case PasswordSet = 'password_set';
    case PasswordChanged = 'password_changed';
    case Reset = 'reset';
    case HandedOver = 'handed_over';
    case Suspended = 'suspended';
    case Reactivated = 'reactivated';
    case Closed = 'closed';
    case LoginSuccess = 'login_success';
    case LoginFailed = 'login_failed';
    case SessionsRevoked = 'sessions_revoked';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Created => 'Créé',
            self::ActivationLinkIssued => 'Lien d’activation envoyé',
            self::PasswordSet => 'Mot de passe défini',
            self::PasswordChanged => 'Mot de passe modifié',
            self::Reset => 'Réinitialisé',
            self::HandedOver => 'Transféré',
            self::Suspended => 'Suspendu',
            self::Reactivated => 'Réactivé',
            self::Closed => 'Clôturé',
            self::LoginSuccess => 'Connexion réussie',
            self::LoginFailed => 'Connexion échouée',
            self::SessionsRevoked => 'Sessions révoquées',
        };
    }
}

enum ActorType: string
{
    use HasLabel;

    case Staff = 'staff';
    case Owner = 'owner';
    case System = 'system';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Staff => 'Staff',
            self::Owner => 'Copropriétaire',
            self::System => 'Système',
        };
    }
}
