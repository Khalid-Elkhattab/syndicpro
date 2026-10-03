<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\Coproprietaire\StoreCoproprietaireRequest;
use App\Http\Requests\Syndic\Coproprietaire\UpdateCoproprietaireRequest;
use App\Http\Resources\CoproprietaireResource;
use App\Services\CoproprietaireService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CoproprietaireController extends Controller
{
    public function __construct(
        private readonly CoproprietaireService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'residence_id', 'is_active']);
        $perPage = min($request->get('per_page', 20), 100);

        $result = $this->service->index($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => CoproprietaireResource::collection($result->items()),
            'message' => 'Succès.',
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    public function store(StoreCoproprietaireRequest $request): JsonResponse
    {
        $result = $this->service->create($request->validated());
        $user = $result['user'];

        $message = $result['activation_token']
            ? 'Copropriétaire créé. Transmettez-lui son lien d’activation (affiché une seule fois).'
            : 'Copropriétaire créé avec succès.';

        return ApiResponse::success(
            new CoproprietaireResource($user->load('appartements')),
            $message,
            201,
            $result['activation_token'] ? ['activation_token' => $result['activation_token']] : null
        );
    }

    public function show(int $id): JsonResponse
    {
        $user = $this->service->getWithStats($id);

        return ApiResponse::success(new CoproprietaireResource($user));
    }

    public function update(UpdateCoproprietaireRequest $request, int $id): JsonResponse
    {
        $user = $this->service->update($id, $request->validated());

        return ApiResponse::success(new CoproprietaireResource($user->load('appartements')), 'Copropriétaire mis à jour avec succès.');
    }

    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ], [
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
        ]);

        $user = $this->service->resetPassword($id, $request->input('password'));

        return ApiResponse::success(new CoproprietaireResource($user), 'Mot de passe réinitialisé avec succès.');
    }

    public function toggleActif(int $id): JsonResponse
    {
        $user = $this->service->toggleActif($id);
        $message = $user->is_active
            ? 'Compte réactivé avec succès.'
            : 'Compte désactivé avec succès.';

        return ApiResponse::success(new CoproprietaireResource($user), $message);
    }
}
