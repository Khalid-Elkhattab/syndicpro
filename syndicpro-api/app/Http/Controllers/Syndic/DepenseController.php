<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\Depense\StoreDepenseRequest;
use App\Http\Requests\Syndic\Depense\UpdateDepenseRequest;
use App\Http\Resources\DepenseResource;
use App\Services\DepenseService;
use App\Models\Depense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepenseController extends Controller
{
    public function __construct(
        private readonly DepenseService $service
    ) {}

    public function index(Request $request, int $residence): JsonResponse
    {
        $filters = $request->only(['sous_charge_id', 'compte_charge_id', 'date_debut', 'date_fin', 'per_page']);
        $depenses = $this->service->getByResidence($residence, $filters);

        return ApiResponse::paginated($depenses, DepenseResource::class);
    }

    public function store(StoreDepenseRequest $request, int $residence): JsonResponse
    {
        $data = $request->validated();
        $data['residence_id'] = $residence;

        $depense = $this->service->create($data, $request->file('justificatif'));

        return ApiResponse::created(new DepenseResource($depense), 'Dépense enregistrée avec succès.');
    }

    public function show(int $depense): JsonResponse
    {
        $depenseModel = Depense::with(['sousCharge.compteCharge', 'residence'])->find($depense);

        if (!$depenseModel) {
            return ApiResponse::notFound();
        }

        return ApiResponse::success(new DepenseResource($depenseModel));
    }

    public function update(UpdateDepenseRequest $request, int $depense): JsonResponse
    {
        $depenseModel = $this->service->update($depense, $request->validated());
        return ApiResponse::success(new DepenseResource($depenseModel), 'Dépense mise à jour avec succès.');
    }

    public function destroy(int $depense): JsonResponse
    {
        $this->service->delete($depense);
        return ApiResponse::success(null, 'Dépense supprimée avec succès.');
    }

    public function justificatif(int $depense): JsonResponse
    {
        $url = $this->service->getJustificatifUrl($depense);

        if (!$url) {
            return ApiResponse::notFound('Aucun justificatif trouvé pour cette dépense.');
        }

        return ApiResponse::success(['url' => $url]);
    }
}