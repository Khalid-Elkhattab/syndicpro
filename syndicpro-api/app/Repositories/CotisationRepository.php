<?php

namespace App\Repositories;

use App\Models\Cotisation;
use App\Models\CotisationDetail;
use Illuminate\Pagination\LengthAwarePaginator;

class CotisationRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Cotisation());
    }

    public function findByResidence(int $residenceId, array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->where('residence_id', $residenceId)
            ->when(isset($filters['type']), fn($q, $type) => $q->where('type', $type))
            ->when(isset($filters['periode_id']), fn($q, $periodeId) => $q->where('periode_id', $periodeId))
            ->with(['periode', 'cotisationDetails'])
            ->orderByDesc('created_at')
            ->get();
    }

    public function findWithResidence(int $id): ?Cotisation
    {
        return $this->model
            ->with(['residence', 'periode'])
            ->find($id);
    }

    public function findWithDetails(int $id): ?Cotisation
    {
        return $this->model
            ->with([
                'cotisationDetails.appartement.immeuble',
                'cotisationDetails.coproprietaire',
                'cotisationDetails.paiements',
                'periode',
            ])
            ->find($id);
    }

    public function bulkCreateDetails(array $details): \Illuminate\Database\Eloquent\Collection
    {
        if (empty($details)) {
            return new \Illuminate\Database\Eloquent\Collection();
        }

        $first = $details[0];
        CotisationDetail::insert($details);

        return \App\Models\CotisationDetail::where('cotisation_id', $first['cotisation_id'])
            ->whereIn('appartement_id', collect($details)->pluck('appartement_id'))
            ->get();
    }

    public function getImpayesByResidence(int $residenceId, array $filters = []): LengthAwarePaginator
    {
        $query = CotisationDetail::query()
            ->join('cotisations', 'cotisation_details.cotisation_id', '=', 'cotisations.id')
            ->where('cotisations.residence_id', $residenceId)
            ->whereIn('cotisation_details.statut', ['non_paye', 'partiellement_paye'])
            ->select('cotisation_details.*')
            ->with([
                'cotisation',
                'appartement.immeuble',
                'coproprietaire',
            ])
            ->when(isset($filters['periode_id']), fn($q, $periodeId) =>
                $q->where('cotisations.periode_id', $periodeId)
            )
            ->when(isset($filters['statut']), fn($q, $statut) => $q->where('cotisation_details.statut', $statut));

        $perPage = $filters['per_page'] ?? 20;
        return $query->orderByDesc('cotisation_details.created_at')->paginate($perPage);
    }

    public function getPrevisualisation(int $residenceId, string $mode, float $montant, int $periodeId): array
    {
        $appartements = app(AppartementRepository::class)->findActifsByResidence($residenceId);

        if ($appartements->isEmpty()) {
            return [];
        }

        $totalTantiemes = $appartements->sum('tantieme');

        return $appartements->map(function ($appartement) use ($mode, $montant, $totalTantiemes) {
            $montantCalcule = match ($mode) {
                'egale' => round($montant / $appartements->count(), 2),
                'par_tantieme' => $totalTantiemes > 0
                    ? round(($appartement->tantieme / $totalTantiemes) * $montant, 2)
                    : 0,
                'par_appartement' => 0,
                default => 0,
            };

            return [
                'appartement_id' => $appartement->id,
                'numero' => $appartement->numero,
                'etage' => $appartement->etage,
                'immeuble_nom' => $appartement->immeuble?->nom,
                'coproprietaire_nom' => $appartement->coproprietaire?->name,
                'tantieme' => $appartement->tantieme,
                'montant_calcule' => $montantCalcule,
            ];
        })->toArray();
    }

    public function findAllFixe(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model
            ->where('type', 'fixe')
            ->with(['residence', 'periode'])
            ->get();
    }

    public function findDetailWithRelations(int $id): ?CotisationDetail
    {
        return CotisationDetail::with([
            'appartement.immeuble',
            'cotisation',
            'coproprietaire',
            'paiements',
        ])->find($id);
    }

    public function findDetailsByResidence(int $residenceId): \Illuminate\Database\Eloquent\Collection
    {
        return CotisationDetail::join('cotisations', 'cotisation_details.cotisation_id', '=', 'cotisations.id')
            ->where('cotisations.residence_id', $residenceId)
            ->select('cotisation_details.*')
            ->with([
                'cotisation',
                'appartement.immeuble',
                'coproprietaire',
            ])
            ->get();
    }

    public function findDetailsByCoproprietaire(int $coproprietaireId, array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        return CotisationDetail::where('coproprietaire_id', $coproprietaireId)
            ->with(['cotisation', 'paiements', 'appartement'])
            ->when(isset($filters['type']), fn($q, $type) =>
                $q->join('cotisations', 'cotisation_details.cotisation_id', '=', 'cotisations.id')
                  ->where('cotisations.type', $type)
                  ->select('cotisation_details.*')
            )
            ->when(isset($filters['statut']), fn($q, $statut) => $q->where('statut', $statut))
            ->get();
    }
}
