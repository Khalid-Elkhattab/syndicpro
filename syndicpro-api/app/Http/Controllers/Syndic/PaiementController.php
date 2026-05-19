<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Syndic\Paiement\StorePaiementRequest;
use App\Http\Resources\PaiementResource;
use App\Services\PaiementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class PaiementController extends Controller
{
    public function __construct(
        private PaiementService $paiementService,
    ) {}

    public function index(Request $request, int $residenceId): JsonResponse
    {
        $filters = $request->only(['coproprietaire_id', 'date_debut', 'date_fin', 'per_page']);

        $paiements = $this->paiementService->getPaiementsByResidence($residenceId, $filters);

        return response()->json([
            'success' => true,
            'data' => PaiementResource::collection($paiements),
            'meta' => [
                'current_page' => $paiements->currentPage(),
                'last_page' => $paiements->lastPage(),
                'per_page' => $paiements->perPage(),
                'total' => $paiements->total(),
            ],
            'message' => 'Paiements récupérés avec succès.',
        ]);
    }

    public function store(StorePaiementRequest $request): JsonResponse
    {
        try {
            $paiement = $this->paiementService->enregistrerPaiement($request->validated());

            return response()->json([
                'success' => true,
                'data' => new PaiementResource($paiement->load(['cotisationDetail', 'coproprietaire'])),
                'message' => 'Paiement enregistré avec succès. Le reçu est en cours de génération.',
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function recu(int $paiement): JsonResponse
    {
        $pai = \App\Models\Paiement::find($paiement);

        if (!$pai || !$pai->recu_path) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Le reçu n\'est pas encore disponible.',
            ], 404);
        }

        $signedUrl = URL::temporarySignedRoute(
            'syndic.paiements.download-recu',
            now()->addMinutes(60),
            ['paiement' => $paiement]
        );

        return response()->json([
            'success' => true,
            'data' => ['recu_url' => $signedUrl],
            'message' => 'URL du reçu générée.',
        ]);
    }

    public function downloadRecu(int $paiement): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $pai = \App\Models\Paiement::findOrFail($paiement);

        if (!$pai->recu_path || !\Illuminate\Support\Facades\Storage::disk('local')->exists($pai->recu_path)) {
            abort(404, 'Le reçu n\'existe pas.');
        }

        return \Illuminate\Support\Facades\Storage::disk('local')->download($pai->recu_path);
    }

    public function totalPercu(Request $request, int $residenceId): JsonResponse
    {
        $periodeId = $request->query('periode_id');

        $totaux = $this->paiementService->getTotalPercu($residenceId, $periodeId ? (int) $periodeId : null);

        return response()->json([
            'success' => true,
            'data' => $totaux,
            'message' => 'Total perçu récupéré avec succès.',
        ]);
    }
}