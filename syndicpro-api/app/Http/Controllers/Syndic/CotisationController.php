<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cotisation\StoreCotisationExceptionnelleRequest;
use App\Http\Requests\Cotisation\StoreCotisationFixeRequest;
use App\Http\Resources\CotisationDetailResource;
use App\Http\Resources\CotisationResource;
use App\Models\Cotisation;
use App\Services\CotisationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CotisationController extends Controller
{
    public function __construct(
        private CotisationService $cotisationService,
    ) {}

    public function index(Request $request, int $residenceId): JsonResponse
    {
        $filters = $request->only(['type', 'periode_id']);

        $cotisations = $this->cotisationService->getCotisationsByResidence($residenceId, $filters);

        return response()->json([
            'success' => true,
            'data' => CotisationResource::collection($cotisations),
            'message' => 'Cotisations récupérées avec succès.',
        ]);
    }

    public function storeFixe(StoreCotisationFixeRequest $request, int $residenceId): JsonResponse
    {
        $cotisation = $this->cotisationService->createCotisationFixe(
            $request->validated(),
            $residenceId
        );

        return response()->json([
            'success' => true,
            'data' => new CotisationResource($cotisation),
            'message' => 'Cotisation fixe créée avec succès.',
        ], 201);
    }

    public function storeExceptionnelle(StoreCotisationExceptionnelleRequest $request, int $residenceId): JsonResponse
    {
        $cotisation = $this->cotisationService->createCotisationExceptionnelle(
            $request->validated(),
            $residenceId
        );

        return response()->json([
            'success' => true,
            'data' => new CotisationResource($cotisation->load('cotisationDetails')),
            'message' => 'Cotisation exceptionnelle créée avec succès.',
        ], 201);
    }

    public function details(int $cotisation): JsonResponse
    {
        $cotisationModel = \App\Models\Cotisation::with([
            'cotisationDetails.appartement.immeuble',
            'cotisationDetails.coproprietaire',
            'cotisationDetails.paiements',
            'periode',
        ])->findOrFail($cotisation);

        return response()->json([
            'success' => true,
            'data' => CotisationDetailResource::collection($cotisationModel->cotisationDetails),
            'message' => 'Détails de la cotisations récupérés avec succès.',
        ]);
    }

    public function previsualiser(Request $request, int $residenceId): JsonResponse
    {
        $validated = $request->validate([
            'mode_repartition' => 'required|in:egale,par_appartement,par_tantieme',
            'montant_total' => 'required|numeric|min:1',
            'periode_id' => 'required|exists:periodes,id',
        ]);

        $previsualisation = $this->cotisationService->getPrevisualisation(
            $residenceId,
            $validated['mode_repartition'],
            (float) $validated['montant_total'],
            (int) $validated['periode_id']
        );

        return response()->json([
            'success' => true,
            'data' => $previsualisation,
            'message' => 'Prévisualisation calculée avec succès.',
        ]);
    }

    public function total(Request $request, int $residenceId): JsonResponse
    {
        $periodeId = $request->integer('periode_id');

        $query = Cotisation::where('residence_id', $residenceId);

        if ($periodeId) {
            $query->where('periode_id', $periodeId);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_cotisations' => (float) $query->sum('montant_total'),
                'nb_cotisations' => $query->count(),
            ],
            'message' => 'Total des cotisations récupéré avec succès.',
        ]);
    }

    public function impayes(Request $request, int $residenceId): JsonResponse
    {
        $filters = $request->only(['periode_id', 'statut', 'per_page']);

        $impayes = $this->cotisationService->getImpayesByResidence($residenceId, $filters);

        return response()->json([
            'success' => true,
            'data' => CotisationDetailResource::collection($impayes),
            'meta' => [
                'current_page' => $impayes->currentPage(),
                'last_page' => $impayes->lastPage(),
                'per_page' => $impayes->perPage(),
                'total' => $impayes->total(),
            ],
            'message' => 'Impayés récupérés avec succès.',
        ]);
    }
}