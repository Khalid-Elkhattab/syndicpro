<?php

namespace App\Http\Controllers\Coproprietaires;

use App\Enums\CotisationDetailStatut;
use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Resources\AppartementResource;
use App\Http\Resources\PaiementResource;
use App\Http\Resources\ReclamationResource;
use App\Models\Appartement;
use App\Models\CotisationDetail;
use App\Models\Paiement;
use App\Models\Reclamation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $userId = Auth::id();

        $appartements = Appartement::where('coproprietaire_id', $userId)
            ->whereNull('deleted_at')
            ->with(['immeuble', 'residence'])
            ->get();

        $currentMonth = now()->month;
        $currentYear = now()->year;

        $montantDuCeMois = CotisationDetail::where('coproprietaire_id', $userId)
            ->join('cotisations', 'cotisation_details.cotisation_id', '=', 'cotisations.id')
            ->where('cotisations.mois', $currentMonth)
            ->where('cotisations.annee', $currentYear)
            ->where('cotisations.type', 'fixe')
            ->where('cotisation_details.statut', '!=', CotisationDetailStatut::Paye)
            ->sum('cotisation_details.montant');

        $impayesAgg = CotisationDetail::where('coproprietaire_id', $userId)
            ->whereIn('statut', [CotisationDetailStatut::NonPaye, CotisationDetailStatut::PartiellementPaye])
            ->selectRaw('COALESCE(SUM(montant - montant_paye), 0) as total_impayes')
            ->selectRaw('COUNT(*) as nb_impayes')
            ->first();

        $dernierPaiement = Paiement::where('coproprietaire_id', $userId)
            ->orderByDesc('date_paiement')
            ->first();

        $reclamationsEnCours = Reclamation::where('coproprietaire_id', $userId)
            ->whereIn('statut', ['nouveau', 'en_cours'])
            ->count();

        $derniersPaiements = Paiement::where('coproprietaire_id', $userId)
            ->with(['cotisationDetail.cotisation'])
            ->orderByDesc('date_paiement')
            ->limit(5)
            ->get();

        $dernieresReclamations = Reclamation::where('coproprietaire_id', $userId)
            ->orderByDesc('created_at')
            ->limit(3)
            ->get();

        $activiteRecente = collect();
        foreach ($derniersPaiements as $p) {
            $activiteRecente->push([
                'type' => 'paiement',
                'id' => $p->id,
                'date' => $p->date_paiement,
                'montant' => $p->montant,
            ]);
        }
        foreach ($dernieresReclamations as $r) {
            $activiteRecente->push([
                'type' => 'reclamation',
                'id' => $r->id,
                'date' => $r->created_at,
                'titre' => $r->titre,
                'statut' => $r->statut,
            ]);
        }
        $activiteRecente = $activiteRecente->sortByDesc('date')->take(5)->values();

        return ApiResponse::success([
            'montant_du_ce_mois' => (float) $montantDuCeMois,
            'total_impayes' => (float) ($impayesAgg->total_impayes ?? 0),
            'nb_impayes' => (int) ($impayesAgg->nb_impayes ?? 0),
            'dernier_paiement' => $dernierPaiement ? [
                'date' => $dernierPaiement->date_paiement?->format('d/m/Y'),
                'montant' => (float) $dernierPaiement->montant,
            ] : null,
            'reclamations_en_cours' => $reclamationsEnCours,
            'appartements' => AppartementResource::collection($appartements),
            'activite_recente' => $activiteRecente,
        ]);
    }
}
