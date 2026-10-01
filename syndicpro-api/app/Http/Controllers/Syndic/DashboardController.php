<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Models\Cotisation;
use App\Models\CotisationDetail;
use App\Models\Depense;
use App\Models\Reclamation;
use App\Services\BudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function __construct(
        private BudgetService $budgetService,
    ) {}

    public function index(int $residenceId): JsonResponse
    {
        $periode = $this->budgetService->getActivePeriodeForResidence($residenceId)
            ?? \App\Models\Periode::where('residence_id', $residenceId)->latest()->first();

        $periodeId = $periode?->id;

        $budget = $periodeId
            ? $this->budgetService->getBudgetSummary($periodeId)
            : null;

        if ($budget) {
            $budget['taux_consommation_global'] = $budget['prevu_total'] > 0
                ? round(($budget['consomme_total'] / $budget['prevu_total']) * 100, 2)
                : 0;
        }

        $cotisationsTotal = $periodeId
            ? Cache::remember("dashboard_cotisations_{$residenceId}_{$periodeId}", now()->addMinutes(5), fn() =>
                Cotisation::where('residence_id', $residenceId)
                    ->where('periode_id', $periodeId)
                    ->sum('montant_total')
            )
            : 0;

        $impayes = CotisationDetail::join('cotisations', 'cotisation_details.cotisation_id', '=', 'cotisations.id')
            ->where('cotisations.residence_id', $residenceId)
            ->whereIn('cotisation_details.statut', ['non_paye', 'partiellement_paye'])
            ->when($periodeId, fn($q) => $q->where('cotisations.periode_id', $periodeId))
            ->select('cotisation_details.*')
            ->with(['cotisation', 'appartement.immeuble', 'coproprietaire'])
            ->orderByDesc('cotisation_details.created_at')
            ->limit(5)
            ->get();

        $impayesMeta = CotisationDetail::join('cotisations', 'cotisation_details.cotisation_id', '=', 'cotisations.id')
            ->where('cotisations.residence_id', $residenceId)
            ->whereIn('cotisation_details.statut', ['non_paye', 'partiellement_paye'])
            ->when($periodeId, fn($q) => $q->where('cotisations.periode_id', $periodeId))
            ->selectRaw('COALESCE(SUM(cotisation_details.montant - cotisation_details.montant_paye), 0) as total_restant_du')
            ->selectRaw('COALESCE(SUM(cotisation_details.montant), 0) as total_impaye')
            ->selectRaw('COUNT(*) as nb_impayes')
            ->first();

        $recentDepenses = Depense::where('residence_id', $residenceId)
            ->with(['sousCharge.compteCharge'])
            ->orderByDesc('date')
            ->limit(5)
            ->get();

        $recentReclamations = Reclamation::where('residence_id', $residenceId)
            ->with(['coproprietaire', 'appartement'])
            ->orderByDesc('created_at')
            ->limit(3)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'active_periode' => $periode ? [
                    'id' => $periode->id,
                    'annee' => $periode->annee,
                    'mois_debut' => $periode->mois_debut,
                    'mois_fin' => $periode->mois_fin,
                    'is_active' => $periode->is_active,
                    'date_debut' => $periode->date_debut,
                    'date_fin' => $periode->date_fin,
                    'residence_id' => $periode->residence_id,
                ] : null,
                'budget' => $budget,
                'cotisations_total' => (float) $cotisationsTotal,
                'impayes' => [
                    'data' => $impayes->toArray(),
                    'total_impaye' => (float) ($impayesMeta->total_impaye ?? 0),
                    'total_restant_du' => (float) ($impayesMeta->total_restant_du ?? 0),
                    'nb_impayes' => (int) ($impayesMeta->nb_impayes ?? 0),
                ],
                'depenses_recentes' => $recentDepenses->toArray(),
                'reclamations_recentes' => $recentReclamations->toArray(),
            ],
            'message' => 'Tableau de bord récupéré avec succès.',
        ]);
    }
}
