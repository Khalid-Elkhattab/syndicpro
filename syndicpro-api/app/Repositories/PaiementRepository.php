<?php

namespace App\Repositories;

use App\Models\CotisationDetail;
use App\Models\Paiement;
use App\Models\Periode;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class PaiementRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Paiement());
    }

    public function findByResidence(int $residenceId, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model
            ->join('cotisation_details', 'paiements.cotisation_detail_id', '=', 'cotisation_details.id')
            ->join('cotisations', 'cotisation_details.cotisation_id', '=', 'cotisations.id')
            ->where('cotisations.residence_id', $residenceId)
            ->select('paiements.*')
            ->with([
                'cotisationDetail.cotisation',
                'cotisationDetail.appartement.immeuble',
                'coproprietaire',
            ])
            ->when(isset($filters['coproprietaire_id']), fn($q, $copropId) =>
                $q->where('paiements.coproprietaire_id', $copropId)
            )
            ->when(isset($filters['date_debut']), fn($q, $dateDebut) =>
                $q->where('paiements.date_paiement', '>=', $dateDebut)
            )
            ->when(isset($filters['date_fin']), fn($q, $dateFin) =>
                $q->where('paiements.date_paiement', '<=', $dateFin)
            );

        $perPage = min($filters['per_page'] ?? 20, 100);
        return $query->orderByDesc('paiements.date_paiement')->paginate($perPage);
    }

    public function findDetail(int $cotisationDetailId): ?CotisationDetail
    {
        return CotisationDetail::with([
            'cotisation',
            'appartement.immeuble',
            'coproprietaire',
            'paiements',
        ])->find($cotisationDetailId);
    }

    public function sumPaiementsByDetail(int $cotisationDetailId): float
    {
        return (float) $this->model
            ->where('cotisation_detail_id', $cotisationDetailId)
            ->sum('montant');
    }

    public function updateDetail(int $cotisationDetailId, array $data): void
    {
        CotisationDetail::where('id', $cotisationDetailId)->update($data);
    }

    public function getHistoriqueByAppartement(int $appartementId): Collection
    {
        return $this->model
            ->join('cotisation_details', 'paiements.cotisation_detail_id', '=', 'cotisation_details.id')
            ->where('cotisation_details.appartement_id', $appartementId)
            ->select('paiements.*')
            ->with(['cotisationDetail.cotisation'])
            ->orderByDesc('paiements.date_paiement')
            ->get();
    }

    public function getTotalPercu(int $residenceId, ?int $periodeId = null): array
    {
        $query = $this->model
            ->join('cotisation_details', 'paiements.cotisation_detail_id', '=', 'cotisation_details.id')
            ->join('cotisations', 'cotisation_details.cotisation_id', '=', 'cotisations.id')
            ->where('cotisations.residence_id', $residenceId);

        if ($periodeId) {
            $query->where('cotisations.periode_id', $periodeId);
        }

        return [
            'total_percu' => (float) (clone $query)->sum('paiements.montant'),
            'nb_paiements' => (clone $query)->count('paiements.id'),
        ];
    }

    public function findByCoproprietaire(int $coproprietaireId, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model
            ->where('coproprietaire_id', $coproprietaireId)
            ->with(['cotisationDetail.cotisation'])
            ->when(isset($filters['date_debut']), fn($q, $dateDebut) =>
                $q->where('date_paiement', '>=', $dateDebut)
            )
            ->when(isset($filters['date_fin']), fn($q, $dateFin) =>
                $q->where('date_paiement', '<=', $dateFin)
            );

        $perPage = min($filters['per_page'] ?? 20, 100);
        return $query->orderByDesc('date_paiement')->paginate($perPage);
    }
}
