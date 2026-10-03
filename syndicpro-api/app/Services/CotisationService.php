<?php

namespace App\Services;

use App\Models\Cotisation;
use App\Models\CotisationDetail;
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

    public function calculerRepartitionEgale(Cotisation $cotisation, Collection $appartements): array
    {
        $count = max($appartements->count(), 1);
        $montant = round((float) $cotisation->montant_total / $count, 2);

        return $appartements->map(fn ($a) => [
            'cotisation_id' => $cotisation->id,
            'appartement_id' => $a->id,
            'coproprietaire_id' => $a->coproprietaire_id,
            'montant' => $montant,
            'montant_paye' => 0,
            'statut' => 'non_paye',
        ])->all();
    }

    public function calculerRepartitionParTantieme(Cotisation $cotisation, Collection $appartements): array
    {
        $total = (float) $appartements->sum('tantieme');
        if ($total <= 0) {
            throw new \LogicException('Total tantiemes nul');
        }

        return $appartements->map(fn ($a) => [
            'cotisation_id' => $cotisation->id,
            'appartement_id' => $a->id,
            'coproprietaire_id' => $a->coproprietaire_id,
            'montant' => round(((float) $a->tantieme / $total) * (float) $cotisation->montant_total, 2),
            'montant_paye' => 0,
            'statut' => 'non_paye',
        ])->all();
    }

    public function calculerRepartitionParAppartement(Cotisation $cotisation, Collection $appartements, array $montantsMap = []): array
    {
        return $appartements->map(fn ($a) => [
            'cotisation_id' => $cotisation->id,
            'appartement_id' => $a->id,
            'coproprietaire_id' => $a->coproprietaire_id,
            'montant' => (float) ($montantsMap[$a->id] ?? 0),
            'montant_paye' => 0,
            'statut' => 'non_paye',
        ])->all();
    }

    private function createCotisation(array $data, int $residenceId): Cotisation
    {
        return DB::transaction(function () use ($data, $residenceId) {
            $cotisation = Cotisation::create([
                'residence_id' => $residenceId,
                'periode_id' => $data['periode_id'],
                'type' => $data['type'],
                'label' => $data['label'] ?? ('Cotisation '.now()->format('Y-m-d')),
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
        $cotisation->montant_total = (float) ($data['montant_total'] ?? $data['montant'] ?? 0);
        $mode = $data['mode_repartition'] ?? $data['mode'] ?? 'egale';
        $appartements = $this->appartementRepo->findActifsByResidence($cotisation->residence_id);

        $details = match ($mode) {
            'egale' => $this->calculerRepartitionEgale($cotisation, $appartements),
            'par_tantieme' => $this->calculerRepartitionParTantieme($cotisation, $appartements),
            'par_appartement' => $this->calculerRepartitionParAppartement($cotisation, $appartements, $data['montants_map'] ?? []),
            default => [],
        };

        $this->cotisationRepo->bulkCreateDetails($details);

        return (float) collect($details)->sum('montant');
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
