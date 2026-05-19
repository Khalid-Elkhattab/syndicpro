<?php

namespace App\Notifications;

use App\Models\Reclamation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReclamationUpdatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Reclamation $reclamation
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $statutLabel = $this->getStatutLabel();

        $mail = (new MailMessage)
            ->subject("Votre réclamation a été mise à jour — {$statutLabel}")
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Votre réclamation a été traitée.")
            ->line("**Titre :** {$this->reclamation->titre}")
            ->line("**Nouveau statut :** {$statutLabel}");

        if ($this->reclamation->reponse_syndic) {
            $mail->line("**Réponse du syndic :**")
                 ->line($this->reclamation->reponse_syndic);
        }

        return $mail
            ->action('Voir ma réclamation', url('/coproprietaire/reclamations'))
            ->salutation('— L\'équipe SyndicPro');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'reclamation_id' => $this->reclamation->id,
            'statut' => $this->reclamation->statut->value ?? $this->reclamation->statut,
            'reponse_syndic' => $this->reclamation->reponse_syndic,
        ];
    }

    private function getStatutLabel(): string
    {
        $statut = $this->reclamation->statut instanceof \App\Enums\ReclamationStatut
            ? $this->reclamation->statut->value
            : $this->reclamation->statut;

        return match ($statut) {
            'nouveau' => 'Nouveau',
            'en_cours' => 'En cours',
            'traite' => 'Traité',
            'rejete' => 'Rejeté',
            default => 'Inconnu',
        };
    }
}