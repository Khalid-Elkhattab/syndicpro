<?php

namespace App\Services;

use App\Enums\ReclamationStatut;
use App\Events\ReclamationUpdated;
use App\Models\Appartement;
use App\Models\Reclamation;
use App\Models\User;
use App\Notifications\NouvelleReclamationNotification;
use App\Repositories\ReclamationRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ReclamationService
{
    public function __construct(
        private ReclamationRepository $reclamationRepository
    ) {}

    public function create(array $data, int $coproprietaireId): Reclamation
    {
        $appartement = Appartement::findOrFail($data['appartement_id']);

        if ($appartement->coproprietaire_id !== $coproprietaireId) {
            throw new \InvalidArgumentException("L'appartement ne vous appartient pas.");
        }

        $reclamation = $this->reclamationRepository->create([
            ...$data,
            'coproprietaire_id' => $coproprietaireId,
            'residence_id' => $appartement->residence_id,
            'statut' => ReclamationStatut::Nouveau,
        ]);

        $reclamation->load('residence.syndic');
        $syndic = $reclamation->residence->syndic;
        $syndic->notify(new NouvelleReclamationNotification($reclamation));

        return $reclamation->load(['coproprietaire', 'appartement', 'residence']);
    }

    public function updateStatut(int $reclamationId, string $statut, ?string $reponse): Reclamation
    {
        $reclamation = $this->reclamationRepository->findOrFail($reclamationId);

        $updateData = [
            'statut' => $statut,
            'reponse_syndic' => $reponse,
            'date_reponse' => now(),
        ];

        $reclamation = $this->reclamationRepository->update($reclamationId, $updateData);

        event(new ReclamationUpdated($reclamation));

        return $reclamation->load(['coproprietaire', 'appartement', 'residence']);
    }

    public function getByResidence(int $residenceId, array $filters): LengthAwarePaginator
    {
        return $this->reclamationRepository->findByResidence($residenceId, $filters);
    }

    public function getByCoproprietaires(int $coproprietairesId): Collection
    {
        return $this->reclamationRepository->findByCoproprietaires($coproprietairesId);
    }

    public function findById(int $id): ?Reclamation
    {
        return $this->reclamationRepository->findWithDetails($id);
    }

    public function findByIdForCoproprietaire(int $id, int $coproprietaireId): ?Reclamation
    {
        $reclamation = $this->reclamationRepository->findWithDetailsForCoproprietaires($id);

        if (!$reclamation || $reclamation->coproprietaire_id !== $coproprietaireId) {
            return null;
        }

        return $reclamation;
    }
}