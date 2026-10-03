<?php

namespace App\Enums;

/** Approbations, clés API, WhatsApp, imports, site vitrine. */
enum ApprovalAction: string
{
    use HasLabel;

    case Delete = 'delete';
    case SendReminders = 'send_reminders';
    case UpdateRecord = 'update_record';
    case Other = 'other';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Delete => 'Suppression',
            self::SendReminders => 'Envoi de rappels',
            self::UpdateRecord => 'Modification',
            self::Other => 'Autre',
        };
    }
}

enum ApprovalStatus: string
{
    use HasLabel;

    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Expired = 'expired';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Pending => 'En attente',
            self::Approved => 'Approuvée',
            self::Rejected => 'Rejetée',
            self::Expired => 'Expirée',
        };
    }
}

enum ApiChannel: string
{
    use HasLabel;

    case Mcp = 'mcp';
    case Api = 'api';
    case WhatsappAgent = 'whatsapp_agent';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Mcp => 'MCP',
            self::Api => 'API',
            self::WhatsappAgent => 'Agent WhatsApp',
        };
    }
}

enum ConversationStatus: string
{
    use HasLabel;

    case Bot = 'bot';
    case HandedOff = 'handed_off';
    case Closed = 'closed';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Bot => 'Robot',
            self::HandedOff => 'Transférée',
            self::Closed => 'Clôturée',
        };
    }
}

enum MessageDirection: string
{
    use HasLabel;

    case In = 'in';
    case Out = 'out';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::In => 'Entrant',
            self::Out => 'Sortant',
        };
    }
}

enum InquiryType: string
{
    use HasLabel;

    case Contact = 'contact';
    case Quote = 'quote';
    case Demo = 'demo';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Contact => 'Contact',
            self::Quote => 'Devis',
            self::Demo => 'Démo',
        };
    }
}

enum InquiryStatus: string
{
    use HasLabel;

    case New = 'new';
    case Contacted = 'contacted';
    case Closed = 'closed';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::New => 'Nouveau',
            self::Contacted => 'Contacté',
            self::Closed => 'Clôturé',
        };
    }
}

enum SequenceType: string
{
    use HasLabel;

    case Receipt = 'receipt';
    case FundCall = 'fund_call';
    case Notice = 'notice';
    case Request = 'request';
    case FormalNotice = 'formal_notice';
    case Quitus = 'quitus';
    case Minutes = 'minutes';

    public function frenchLabel(): string
    {
        return match ($this) {
            self::Receipt => 'Reçu',
            self::FundCall => 'Appel de fonds',
            self::Notice => 'Convocation',
            self::Request => 'Demande',
            self::FormalNotice => 'Mise en demeure',
            self::Quitus => 'Quitus',
            self::Minutes => 'PV',
        };
    }
}
