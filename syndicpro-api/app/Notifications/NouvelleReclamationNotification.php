<?php

namespace App\Notifications;

use App\Models\Reclamation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NouvelleReclamationNotification extends Notification implements ShouldQueue
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
        $residence = $this->reclamation->residence;
        $coproprietaire = $this->reclamation->coproprietaire;
        $appartement = $this->reclamation->appartement;

        return (new MailMessage)
            ->subject("Nouvelle réclamation — {$residence->nom}")
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Une nouvelle réclamation a été soumise.")
            ->line("**Copropriétaire :** {$coproprietaire->name}")
            ->line("**Appartement :** {$appartement->numero}")
            ->line("**Titre :** {$this->reclamation->titre}")
            ->line("**Priorité :** " . ($this->reclamation->priorite === 'urgente' ? 'Urgente' : 'Normale'))
            ->line("**Description :**")
            ->line($this->reclamation->description)
            ->action('Voir le tableau de bord', url('/syndic/reclamations'))
            ->salutation('— L\'équipe SyndicPro');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'reclamation_id' => $this->reclamation->id,
            'coproprietaire' => $this->reclamation->coproprietaire->name,
            'titre' => $this->reclamation->titre,
            'priorite' => $this->reclamation->priorite,
        ];
    }
}