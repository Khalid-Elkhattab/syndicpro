<?php

namespace App\Notifications;

use App\Enums\InquiryType;
use App\Models\Inquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewInquiryNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Inquiry $inquiry
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $type = $this->inquiry->type instanceof InquiryType
            ? $this->inquiry->type->label()
            : (string) $this->inquiry->type;

        $mail = (new MailMessage)
            ->subject("Nouvelle demande ({$type}) — {$this->inquiry->name}")
            ->greeting('Bonjour,')
            ->line("Une nouvelle demande « {$type} » vient d’arriver depuis le site public.")
            ->line('Nom : '.$this->inquiry->name);

        if ($this->inquiry->email) {
            $mail->line('Email : '.$this->inquiry->email);
        }
        if ($this->inquiry->phone) {
            $mail->line('Téléphone : '.$this->inquiry->phone);
        }
        if ($this->inquiry->message) {
            $mail->line('Message :');
            $mail->line($this->inquiry->message);
        }

        return $mail->salutation('— L’équipe '.config('site.name'));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'inquiry_id' => $this->inquiry->id,
            'type' => (string) $this->inquiry->type,
            'name' => $this->inquiry->name,
        ];
    }
}
