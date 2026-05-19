<?php

namespace Database\Seeders;

use App\Enums\ReclamationStatut;
use App\Models\Appartement;
use App\Models\Reclamation;
use App\Models\Residence;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReclamationSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            ['titre' => 'Panne ascenseur', 'description' => 'L\'ascenseur est en panne depuis ce matin.', 'priorite' => 'urgente'],
            ['titre' => 'Éclairage couloir défectueux', 'description' => 'Les lumières du couloir sont grillées.', 'priorite' => 'normale'],
            ['titre' => 'Fuite d\'eau hall', 'description' => 'Fuite d\'eau importante dans le hall.', 'priorite' => 'urgente'],
            ['titre' => 'Problème de sécurité', 'description' => 'La porte d\'entrée ne ferme plus correctement.', 'priorite' => 'normale'],
            ['titre' => 'Bruit excessif', 'description' => 'Bruit tard le soir et tôt le matin.', 'priorite' => 'normale'],
        ];

        $statuts = [
            ReclamationStatut::Nouveau,
            ReclamationStatut::EnCours,
            ReclamationStatut::Traite,
            ReclamationStatut::Rejete,
            ReclamationStatut::Nouveau,
        ];

        $residences = Residence::pluck('id');
        $total = 0;

        foreach ($residences as $residenceId) {
            $appartements = Appartement::where('residence_id', $residenceId)
                ->whereNotNull('coproprietaire_id')
                ->get();

            if ($appartements->isEmpty()) continue;

            foreach ($templates as $i => $template) {
                $appartement = $appartements[$i % $appartements->count()];
                $coproprietaire = User::find($appartement->coproprietaire_id);
                if (!$coproprietaire) continue;

                $data = [
                    'coproprietaire_id' => $coproprietaire->id,
                    'residence_id' => $residenceId,
                    'appartement_id' => $appartement->id,
                    'titre' => $template['titre'],
                    'description' => $template['description'] . ' (Résidence #' . $residenceId . ')',
                    'statut' => $statuts[$i],
                    'priorite' => $template['priorite'],
                ];

                if ($statuts[$i] !== ReclamationStatut::Nouveau) {
                    $data['reponse_syndic'] = 'Nous avons pris en charge votre réclamation. Une intervention est prévue.';
                    $data['date_reponse'] = now()->subDays(random_int(1, 30));
                }

                Reclamation::create($data);
                $total++;
            }
        }

        $this->command->info("✓ ReclamationSeeder: $total réclamations créées");
    }
}
