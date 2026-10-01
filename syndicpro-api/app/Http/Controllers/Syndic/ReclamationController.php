<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Reclamation\UpdateReclamationStatutRequest;
use App\Http\Resources\ReclamationResource;
use App\Models\Residence;
use App\Services\ReclamationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReclamationController extends Controller
{
    public function __construct(
        private ReclamationService $reclamationService
    ) {}

    public function index(Residence $residence, Request $request): JsonResponse
    {
        $filters = $request->only(['statut', 'priorite', 'date_debut', 'date_fin', 'search', 'page']);
        $filters['per_page'] = $request->get('per_page', 20);

        $reclamations = $this->reclamationService->getByResidence(
            $residence->id,
            $filters
        );

        return ApiResponse::paginated($reclamations, ReclamationResource::class);
    }

    public function show(int $id): JsonResponse
    {
        $reclamation = $this->reclamationService->findById($id);

        if (!$reclamation) {
            return ApiResponse::notFound('Réclamation introuvable.');
        }

        return ApiResponse::success(
            ReclamationResource::make($reclamation->load(['coproprietaire', 'residence', 'appartement']))
        );
    }

    public function updateStatut(
        UpdateReclamationStatutRequest $request,
        int $id
    ): JsonResponse {
        $validated = $request->validated();

        $reclamation = $this->reclamationService->updateStatut(
            $id,
            $validated['statut'],
            $validated['reponse_syndic'] ?? null
        );

        return ApiResponse::success(
            ReclamationResource::make($reclamation),
            'Statut mis à jour avec succès. Le copropriétaire a été notifié.'
        );
    }
}