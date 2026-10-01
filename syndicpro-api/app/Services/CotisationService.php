<?php

namespace App\Services;

use App\Models\Cotisation;
use App\Models\CotisationDetail;
use App\Models\Paiement;
use App\Repositories\AppartementRepository;
use App\Repositories\CotisationRepository;
use App\Repositories\PaiementRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CotisationService
{
    public function __construct(
        private CotisationRepository $cotisationRepo,
        private PaiementRepository $paiementRepo,
        private AppartementRepository $appartementRepo,
    ) {}

    public function createCotisationFixe(array $data, int $residenceId): Cotisation
    {
        $data['type'] = 'fixe';
        return $this->createCotisation($data, $residenceId);
    }

    public function createCotisationExceptionnelle(array $data, int $residenceId): Cotisation
    {
        $data['type'] = 'exceptionnelle';
        return $this->createCotisation($data, $residenceId);
    }

    private function createCotisation(array $data, int $residenceId): Cotisation
    {
        return DB::transaction(function () use ($data, $residenceId) {
            $cotisation = Cotisation::create([
                'residence_id' => $residenceId,
                'periode_id' => $data['periode_id'],
                'type' => $data['type'],
                'mode_repartition' => $data['mode_repartition'] ?? $data['mode'] ?? 'egale',
                'montant_total' => 0,
                'mois' => $data['mois'] ?? null,
                'annee' => $data['annee'] ?? null,
                'description' => $data['description'] ?? null,
            ]);

            $montantTotal = $this->generateDetails($cotisation, $data);
            $cotisation->update(['montant_total' => $montantTotal]);

            return $cotisation->fresh(['cotisationDetails']);
        });
    }

    private function generateDetails(Cotisation $cotisation, array $data): float
    {
        $montant = (float) $data['montant_total'] ?? (float) $data['montant'] ?? 0;
        $mode = $data['mode_repartition'] ?? $data['mode'] ?? 'egale';
        $appartements = $this->appartementRepo->findActifsByResidence($cotisation->residence_id);
        $totalTantiemes = $appartements->sum('tantieme');

        $montantTotal = 0;
        $details = [];

        foreach ($appartements as $appartement) {
            $montantCalcule = match ($mode) {
                'egale' => round($montant / max($appartements->count(), 1), 2),
                'par_tantieme' => $totalTantiemes > 0
                    ? round(($appartement->tantieme / $totalTantiemes) * $montant, 2)
                    : 0,
                'par_appartement' => (float) $data['montant_par_appartement'] ?? $montant,
                default => 0,
            };

            $details[] = [
                'cotisation_id' => $cotisation->id,
                'appartement_id' => $appartement->id,
                'coproprietaire_id' => $appartement->coproprietaire_id,
                'montant' => $montantCalcule,
                'montant_paye' => 0,
                'statut' => 'non_paye',
            ];

            $montantTotal += $montantCalcule;
        }

        $this->cotisationRepo->bulkCreateDetails($details);

        return $montantTotal;
    }

    public function getImpayesByCoproprietaire(int $residenceId): Collection
    {
        return $this->cotisationRepo->getImpayesByResidence($residenceId, []);
    }

    public function getImpayesByPeriode(int $periodeId): Collection
    {
        return CotisationDetail::join('cotisations', 'cotisation_details.cotisation_id', '=', 'cotisations.id')
            ->where('cotisations.periode_id', $periodeId)
            ->whereIn('cotisation_details.statut', ['non_paye', 'partiellement_paye'])
            ->select('cotisation_details.*')
            ->with(['cotisation', 'appartement', 'coproprietaire'])
            ->get();
    }

    public function getPrevisualisation(int $residenceId, string $mode, float $montant, int $periodeId): array
    {
        return $this->cotisationRepo->getPrevisualisation($residenceId, $mode, $montant, $periodeId);
    }

    public function getCotisationsByResidence(int $residenceId, array $filters = []): Collection
    {
        return $this->cotisationRepo->findByResidence($residenceId, $filters);
    }

    public function getImpayesByResidence(int $residenceId, array $filters = []): LengthAwarePaginator
    {
        return $this->cotisationRepo->getImpayesByResidence($residenceId, $filters);
    }
}
