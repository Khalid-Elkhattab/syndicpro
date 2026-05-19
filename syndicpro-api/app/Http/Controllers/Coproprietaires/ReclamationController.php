<?php

namespace App\Http\Controllers\Coproprietaires;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reclamation\StoreCoproprietairesReclamationRequest;
use App\Http\Resources\ReclamationResource;
use App\Services\ReclamationService;
use Illuminate\Http\JsonResponse;

class ReclamationController extends Controller
{
    public function __construct(
        private ReclamationService $reclamationService
    ) {}

    public function index(): JsonResponse
    {
        $reclamations = $this->reclamationService->getByCoproprietaires(
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'data' => ReclamationResource::collection($reclamations),
            'message' => 'Liste des réclamations récupérée avec succès.',
        ]);
    }

    public function store(StoreCoproprietairesReclamationRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $reclamation = $this->reclamationService->create(
            $validated,
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'data' => ReclamationResource::make($reclamation),
            'message' => 'Réclamation soumise avec succès. Le syndic a été notifié.',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $reclamation = $this->reclamationService->findByIdForCoproprietaires(
            $id,
            auth()->id()
        );

        if (!$reclamation) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Accès non autorisé à cette réclamation.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => ReclamationResource::make($reclamation->load(['coproprietaires', 'residence', 'appartement'])),
            'message' => 'Réclamation récupérée avec succès.',
        ]);
    }
}