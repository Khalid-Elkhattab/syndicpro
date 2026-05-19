<?php

namespace App\Http\Controllers\Coproprietaires;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Resources\PaiementResource;
use App\Models\Paiement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;

class PaiementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = Auth::id();

        $perPage = min($request->get('per_page', 20), 100);

        $query = Paiement::where('coproprietaire_id', $userId)
            ->with(['cotisationDetail.cotisation']);

        if ($request->filled('date_debut')) {
            $query->where('date_paiement', '>=', $request->date_debut);
        }

        if ($request->filled('date_fin')) {
            $query->where('date_paiement', '<=', $request->date_fin);
        }

        $paiements = $query->latest('date_paiement')->paginate($perPage);

        return ApiResponse::success(
            PaiementResource::collection($paiements),
            message: 'Historique des paiements récupéré avec succès.',
            meta: [
                'current_page' => $paiements->currentPage(),
                'last_page' => $paiements->lastPage(),
                'per_page' => $paiements->perPage(),
                'total' => $paiements->total(),
            ]
        );
    }

    public function recu(Paiement $paiement): JsonResponse
    {
        if ($paiement->coproprietaire_id !== Auth::id()) {
            return ApiResponse::forbidden('Vous n\'êtes pas autorisé à accéder à ce reçu.');
        }

        if (!$paiement->recu_path) {
            return ApiResponse::notFound('Le reçu n\'est pas encore disponible.');
        }

        $signedUrl = URL::temporarySignedRoute(
            'copro.paiements.recu.download',
            now()->addMinutes(60),
            ['paiement' => $paiement->id]
        );

        return ApiResponse::success([
            'recu_url' => $signedUrl,
        ], 'URL du reçu générée.');
    }

    public function downloadRecu(Paiement $paiement): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        if ($paiement->coproprietaire_id !== Auth::id()) {
            abort(403, 'Accès non autorisé.');
        }

        if (!$paiement->recu_path || !\Illuminate\Support\Facades\Storage::disk('local')->exists($paiement->recu_path)) {
            abort(404, 'Le reçu n\'existe pas.');
        }

        return \Illuminate\Support\Facades\Storage::disk('local')->download($paiement->recu_path);
    }
}