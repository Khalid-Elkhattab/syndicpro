<?php

namespace App\Models;

use App\Enums\ConversationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsappConversation extends Model
{
    protected $table = 'whatsapp_conversations';

    protected $fillable = ['phone', 'owner_id', 'status', 'assigned_to', 'last_message_at'];

    protected function casts(): array
    {
        return ['status' => ConversationStatus::class, 'last_message_at' => 'datetime'];
    }

    public function messages(): HasMany
    {
        return $this->hasMany(WhatsappMessage::class, 'conversation_id');
    }
}
