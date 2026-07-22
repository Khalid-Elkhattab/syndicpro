<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Models\CotisationDetail;
use App\Models\Paiement;
use App\Services\BudgetService;
use App\Services\CotisationService;
use App\Repositories\PaiementRepository;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RapportController extends Controller
{
    public function __construct(
        private BudgetService $budgetService,
        private CotisationService $cotisationService,
        private PaiementRepository $paiementRepo,
    ) {}

    public function budget(Request $request, int $residenceId): JsonResponse
    {
        $periodeId = $request->integer('periode_id');

        if (!$periodeId) {
            $activePeriode = $this->budgetService->getActivePeriodeForResidence($residenceId);
            if (!$activePeriode) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune période active trouvée pour cette résidence.',
                ], 404);
            }
            $periodeId = $activePeriode->id;
        }

        $summary = $this->budgetService->getBudgetSummary($periodeId);

        $summary['taux_consommation_global'] = $summary['prevu_total'] > 0
            ? round(($summary['consomme_total'] / $summary['prevu_total']) * 100, 2)
            : 0;

        return response()->json([
            'success' => true,
            'data' => $summary,
            'message' => 'Rapport budget récupéré avec succès.',
        ]);
    }

    public function impayes(Request $request, int $residenceId): JsonResponse
    {
        $validated = $request->validate([
            'periode_id' => 'nullable|exists:periodes,id',
            'statut' => 'nullable|in:non_paye,partiellement_paye',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $perPage = min($validated['per_page'] ?? 20, 100);

        $baseQuery = CotisationDetail::query()
            ->join('cotisations', 'cotisation_details.cotisation_id', '=', 'cotisations.id')
            ->where('cotisations.residence_id', $residenceId)
            ->whereIn('cotisation_details.statut', ['non_paye', 'partiellement_paye'])
            ->when($validated['periode_id'] ?? null, fn($q, $pid) =>
                $q->where('cotisations.periode_id', $pid)
            )
            ->when($validated['statut'] ?? null, fn($q, $s) =>
                $q->where('cotisation_details.statut', $s)
            );

        $impayes = (clone $baseQuery)
            ->select('cotisation_details.*')
            ->with([
                'cotisation',
                'appartement.immeuble',
                'coproprietaire',
            ])
            ->paginate($perPage);

        $impayes->getCollection()->transform(function ($detail) {
            $detail->anciennete_jours = Carbon::now()->diffInDays($detail->created_at);
            return $detail;
        });

        $aggregates = (clone $baseQuery)
            ->selectRaw('COALESCE(SUM(cotisation_details.montant), 0) as total_impaye')
            ->selectRaw("COALESCE(SUM(CASE WHEN cotisation_details.statut = 'non_paye' THEN 1 ELSE 0 END), 0) as nb_non_paye")
            ->selectRaw("COALESCE(SUM(CASE WHEN cotisation_details.statut = 'partiellement_paye' THEN 1 ELSE 0 END), 0) as nb_partiel")
            ->first();

        return response()->json([
            'success' => true,
            'data' => $impayes->items(),
            'meta' => [
                'current_page' => $impayes->currentPage(),
                'last_page' => $impayes->lastPage(),
                'per_page' => $impayes->perPage(),
                'total' => $impayes->total(),
                'total_impaye' => (float) ($aggregates->total_impaye ?? 0),
                'nb_impayes' => $impayes->total(),
                'par_statut' => [
                    'non_paye' => (int) ($aggregates->nb_non_paye ?? 0),
                    'partiellement_paye' => (int) ($aggregates->nb_partiel ?? 0),
                ],
            ],
            'message' => 'Rapport impayés récupéré avec succès.',
        ]);
    }

    public function paiements(Request $request, int $residenceId): JsonResponse
    {
        $validated = $request->validate([
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut',
            'periode_id' => 'nullable|exists:periodes,id',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $perPage = min($validated['per_page'] ?? 20, 100);

        $baseQuery = Paiement::query()
            ->join('cotisation_details', 'paiements.cotisation_detail_id', '=', 'cotisation_details.id')
            ->join('cotisations', 'cotisation_details.cotisation_id', '=', 'cotisations.id')
            ->where('cotisations.residence_id', $residenceId)
            ->select('paiements.*');

        $paginatedQuery = clone $baseQuery;
        $paginatedQuery->with([
                'coproprietaire',
                'cotisationDetail.cotisation',
                'cotisationDetail.appartement.immeuble',
            ])
            ->when($validated['date_debut'] ?? null, fn($q, $dd) =>
                $q->where('paiements.date_paiement', '>=', $dd)
            )
            ->when($validated['date_fin'] ?? null, fn($q, $df) =>
                $q->where('paiements.date_paiement', '<=', $df)
            )
            ->when($validated['periode_id'] ?? null, fn($q, $pid) =>
                $q->where('cotisations.periode_id', $pid)
            );

        $paiements = $paginatedQuery->latest('paiements.date_paiement')->paginate($perPage);

        $aggregatesQuery = clone $baseQuery;
        $aggregatesQuery
            ->when($validated['date_debut'] ?? null, fn($q, $dd) =>
                $q->where('paiements.date_paiement', '>=', $dd)
            )
            ->when($validated['date_fin'] ?? null, fn($q, $df) =>
                $q->where('paiements.date_paiement', '<=', $df)
            )
            ->when($validated['periode_id'] ?? null, fn($q, $pid) =>
                $q->where('cotisations.periode_id', $pid)
            );

        $parMode = (clone $aggregatesQuery)
            ->selectRaw('paiements.mode_paiement, SUM(paiements.montant) as total')
            ->groupBy('paiements.mode_paiement')
            ->pluck('total', 'mode_paiement')
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => $paiements->items(),
            'meta' => [
                'current_page' => $paiements->currentPage(),
                'last_page' => $paiements->lastPage(),
                'per_page' => $paiements->perPage(),
                'total' => $paiements->total(),
                'total_percu' => (float) (clone $aggregatesQuery)->sum('paiements.montant'),
                'nb_paiements' => (clone $aggregatesQuery)->count('paiements.id'),
                'par_mode' => [
                    'especes' => (float) ($parMode['especes'] ?? 0),
                    'virement' => (float) ($parMode['virement'] ?? 0),
                    'cheque' => (float) ($parMode['cheque'] ?? 0),
                    'carte' => (float) ($parMode['carte'] ?? 0),
                ],
            ],
            'message' => 'Rapport paiements récupéré avec succès.',
        ]);
    }
}
