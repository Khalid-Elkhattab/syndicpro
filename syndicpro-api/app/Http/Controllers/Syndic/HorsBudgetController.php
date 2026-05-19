<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\HorsBudget\StoreHorsBudgetRequest;
use App\Http\Requests\Syndic\HorsBudget\UpdateHorsBudgetRequest;
use App\Http\Resources\HorsBudgetResource;
use App\Services\HorsBudgetService;
use App\Models\HorsBudget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HorsBudgetController extends Controller
{
    public function __construct(
        private readonly HorsBudgetService $service
    ) {}

    public function index(Request $request, int $residence): JsonResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'per_page']);
        $horsBudgets = $this->service->getByResidence($residence, $filters);

        return ApiResponse::paginated($horsBudgets, HorsBudgetResource::class);
    }

    public function store(StoreHorsBudgetRequest $request, int $residence): JsonResponse
    {
        $data = $request->validated();
        $data['residence_id'] = $residence;

        $horsBudget = $this->service->create($data, $request->file('justificatif'));

        return ApiResponse::created(new HorsBudgetResource($horsBudget), 'Dépense hors budget enregistrée avec succès.');
    }

    public function show(int $residence, int $horsBudget): JsonResponse
    {
        $model = HorsBudget::where('residence_id', $residence)->find($horsBudget);

        if (!$model) {
            return ApiResponse::notFound();
        }

        return ApiResponse::success(new HorsBudgetResource($model));
    }

    public function update(UpdateHorsBudgetRequest $request, int $residence, int $horsBudget): JsonResponse
    {
        $model = $this->service->update($horsBudget, $request->validated());
        return ApiResponse::success(new HorsBudgetResource($model), 'Dépense hors budget mise à jour avec succès.');
    }

    public function destroy(int $residence, int $horsBudget): JsonResponse
    {
        $this->service->delete($horsBudget);
        return ApiResponse::success(null, 'Dépense hors budget supprimée avec succès.');
    }

    public function justificatif(int $horsBudget): JsonResponse
    {
        $url = $this->service->getJustificatifUrl($horsBudget);

        if (!$url) {
            return ApiResponse::notFound('Aucun justificatif trouvé pour cette dépense.');
        }

        return ApiResponse::success(['url' => $url]);
    }
}