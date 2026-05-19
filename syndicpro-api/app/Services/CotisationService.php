<?php

namespace App\Services;

use App\Enums\CotisationDetailStatut;
use App\Events\CotisationCreated;
use App\Models\Cotisation;
use App\Repositories\AppartementRepository;
use App\Repositories\CotisationRepository;
use App\Repositories\PeriodeRepository;
use Illuminate\Database\Eloquent\Collection;

class CotisationService
{
    public function __construct(
        private CotisationRepository $cotisationRepo,
        private AppartementRepository $appartementRepo,
        private PeriodeRepository $periodeRepo,
    ) {}

    public function createCotisationFixe(array $data, int $residenceId): Cotisation
    {
        $periode = $this->periodeRepo->find($data['periode_id']);

        $cotisation = $this->cotisationRepo->create([
            'residence_id' => $residenceId,
            'periode_id' => $data['periode_id'],
            'type' => 'fixe',
            'label' => $data['label'],
            'montant_total' => $data['montant_mensuel'] * 12,
            'montant_mensuel' => $data['montant_mensuel'],
            'description' => $data['description'] ?? null,
        ]);

        event(new CotisationCreated($cotisation));

        return $cotisation->load(['periode']);
    }

    public function createCotisationExceptionnelle(array $data, int $residenceId): Cotisation
    {
        $cotisation = $this->cotisationRepo->create([
            'residence_id' => $residenceId,
            'periode_id' => $data['periode_id'],
            'type' => 'exceptionnelle',
            'label' => $data['label'],
            'montant_total' => $data['montant_total'],
            'mode_repartition' => $data['mode_repartition'],
            'description' => $data['description'] ?? null,
        ]);

        $this->generateDetails(
            $cotisation->id,
            $data['mode_repartition'],
            $data['montants_map'] ?? []
        );

        event(new CotisationCreated($cotisation));

        return $cotisation->load('cotisationDetails');
    }

    public function generateDetails(int $cotisationId, string $mode, array $montantsMap = []): Collection
    {
        $cotisation = $this->cotisationRepo->findWithResidence($cotisationId);

        if (!$cotisation) {
            throw new \RuntimeException('Cotisation non trouvée.');
        }

        $appartements = $this->appartementRepo->findActifsByResidence($cotisation->residence_id);

        if ($appartements->isEmpty()) {
            throw new \RuntimeException('Aucun appartement actif avec propriétaire trouvé.');
        }

        $details = match ($mode) {
            'egale' => $this->calculerRepartitionEgale($cotisation, $appartements),
            'par_appartement' => $this->calculerRepartitionParAppartement($cotisation, $appartements, $montantsMap),
            'par_tantieme' => $this->calculerRepartitionParTantieme($cotisation, $appartements),
            default => throw new \InvalidArgumentException('Mode de répartition invalide.'),
        };

        return $this->cotisationRepo->bulkCreateDetails($details);
    }

    public function calculerRepartitionEgale(Cotisation $cotisation, Collection $appartements): array
    {
        $nbAppartements = $appartements->count();
        $montantParAppart = round($cotisation->montant_total / $nbAppartements, 2);

        return $appartements->map(fn($appartement) => [
            'cotisation_id' => $cotisation->id,
            'appartement_id' => $appartement->id,
            'coproprietaire_id' => $appartement->coproprietaire_id,
            'montant' => $montantParAppart,
            'statut' => CotisationDetailStatut::NonPaye,
            'montant_paye' => 0,
        ])->toArray();
    }

    public function calculerRepartitionParTantieme(Cotisation $cotisation, Collection $appartements): array
    {
        $totalTantiemes = $appartements->sum('tantieme');

        if ($totalTantiemes == 0) {
            throw new \LogicException('Total tantièmes = 0, répartition impossible.');
        }

        return $appartements->map(fn($appartement) => [
            'cotisation_id' => $cotisation->id,
            'appartement_id' => $appartement->id,
            'coproprietaire_id' => $appartement->coproprietaire_id,
            'montant' => round(($appartement->tantieme / $totalTantiemes) * $cotisation->montant_total, 2),
            'statut' => CotisationDetailStatut::NonPaye,
            'montant_paye' => 0,
        ])->toArray();
    }

    public function calculerRepartitionParAppartement(Cotisation $cotisation, Collection $appartements, array $montantsMap): array
    {
        $totalMap = array_sum($montantsMap);
        $difference = abs($totalMap - $cotisation->montant_total);

        if ($difference > 0.01) {
            throw new \InvalidArgumentException(
                "La somme des montants ({$totalMap} DH) doit être égale au montant total ({$cotisation->montant_total} DH)."
            );
        }

        return $appartements->map(fn($appartement) => [
            'cotisation_id' => $cotisation->id,
            'appartement_id' => $appartement->id,
            'coproprietaire_id' => $appartement->coproprietaire_id,
            'montant' => $montantsMap[$appartement->id] ?? 0,
            'statut' => CotisationDetailStatut::NonPaye,
            'montant_paye' => 0,
        ])->toArray();
    }

    public function getImpayesByCoproprietaire(int $residenceId): Collection
    {
        return $this->cotisationRepo->getImpayesByResidence($residenceId, []);
    }

    public function getImpayesByPeriode(int $periodeId): Collection
    {
        return \App\Models\CotisationDetail::whereHas('cotisation', fn($q) =>
            $q->where('periode_id', $periodeId)
        )
            ->whereIn('statut', ['non_paye', 'partiellement_paye'])
            ->with(['cotisation', 'appartement', 'coproprietaire'])
            ->get();
    }

    public function getPrevisualisation(int $residenceId, string $mode, float $montant, int $periodeId): array
    {
        return $this->cotisationRepo->getPrevisualisation($residenceId, $mode, $montant, $periodeId);
    }

    public function getCotisationsByResidence(int $residenceId, array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        return $this->cotisationRepo->findByResidence($residenceId, $filters);
    }

    public function getImpayesByResidence(int $residenceId, array $filters = []): \Illuminate\Pagination\LengthAwarePaginator
    {
        return $this->cotisationRepo->getImpayesByResidence($residenceId, $filters);
    }

public function generateMonthlyCotisations(): array
    {
        $results = [
            'created' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        $currentMonth = now()->month;
        $currentYear = now()->year;

        $cotisationsFixe = $this->cotisationRepo->findAllFixe();

        foreach ($cotisationsFixe as $cotisation) {
            $existingForMonth = \App\Models\Cotisation::where('residence_id', $cotisation->residence_id)
                ->where('type', 'fixe')
                ->where('mois', $currentMonth)
                ->where('annee', $currentYear)
                ->exists();

            if ($existingForMonth) {
                $results['skipped']++;
                continue;
            }

            $newCotisation = \App\Models\Cotisation::create([
                'residence_id' => $cotisation->residence_id,
                'periode_id' => $cotisation->periode_id,
                'type' => 'fixe',
                'label' => $cotisation->label,
                'montant_total' => $cotisation->montant_mensuel,
                'montant_mensuel' => $cotisation->montant_mensuel,
                'mois' => $currentMonth,
                'annee' => $currentYear,
                'description' => $cotisation->description,
            ]);

            $appartements = $this->appartementRepo->findActifsByResidence($cotisation->residence_id);

            foreach ($appartements as $appartement) {
                try {
                    \App\Models\CotisationDetail::create([
                        'cotisation_id' => $newCotisation->id,
                        'appartement_id' => $appartement->id,
                        'coproprietaire_id' => $appartement->coproprietaire_id,
                        'montant' => $cotisation->montant_mensuel,
                        'statut' => CotisationDetailStatut::NonPaye,
                        'montant_paye' => 0,
                    ]);
                    $results['created']++;
                } catch (\Exception $e) {
                    $results['errors'][] = "Erreur pour appartement {$appartement->id}: {$e->getMessage()}";
                }
            }
        }

        return $results;
    }
}