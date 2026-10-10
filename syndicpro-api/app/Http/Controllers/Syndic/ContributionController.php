<?php

namespace App\Http\Controllers\Syndic;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\Contribution\StoreContributionRequest;
use App\Http\Requests\Syndic\Contribution\UpdateContributionRequest;
use App\Models\Building;
use App\Models\Contribution;
use App\Models\FiscalYear;
use App\Models\Lot;
use App\Models\Residence;
use App\Services\DueGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContributionController extends Controller
{
    public function __construct(private DueGenerator $generator) {}

    private function scopedResidence(int $residenceId): Residence
    {
        return Residence::where('id', $residenceId)
            ->where('syndic_id', auth()->id())
            ->firstOrFail();
    }

    private function canPublish(): bool
    {
        $user = auth()->user();

        return $user->can('contributions.publish') || $user->role === UserRole::Syndic;
    }

    public function index(Request $request, int $residence): JsonResponse
    {
        $this->scopedResidence($residence);

        $contributions = Contribution::where('residence_id', $residence)
            ->withCount('contributionLots')
            ->orderByDesc('starts_on')
            ->get()
            ->map(fn ($c) => $this->present($c));

        return ApiResponse::success($contributions->values());
    }

    public function store(StoreContributionRequest $request, int $residence): JsonResponse
    {
        $residenceModel = $this->scopedResidence($residence);
        $data = $request->validated();

        $this->assertFiscalYear($residenceModel->id, $data['fiscal_year_id'] ?? null);
        $buildingIds = $this->assertBuildings($residenceModel->id, $data);

        $contribution = Contribution::create([
            'residence_id' => $residenceModel->id,
            'fiscal_year_id' => $data['fiscal_year_id'] ?? null,
            'type' => $data['type'],
            'name' => $data['name'],
            'starts_on' => $data['starts_on'],
            'ends_on' => $data['ends_on'],
            'calculation_mode' => $data['calculation_mode'],
            'annual_budget' => $data['annual_budget'] ?? null,
            'applies_to_all_buildings' => $data['applies_to_all_buildings'] ?? true,
            'status' => 'draft',
            'created_by' => auth()->id(),
        ]);

        if (! empty($data['fixed_rates'])) {
            $contribution->fixedRates()->createMany($data['fixed_rates']);
        }
        if ($buildingIds !== null) {
            $contribution->buildings()->sync($buildingIds);
        }

        return ApiResponse::success(
            $this->present($contribution->fresh(['fixedRates', 'buildings'])),
            'Cotisation créée à l’état brouillon.',
            201
        );
    }

    public function show(Contribution $contribution): JsonResponse
    {
        $this->assertBelongs((int) $contribution->residence_id, $contribution);
        $contribution->load(['fixedRates', 'buildings:id,number,residence_id', 'contributionLots.lot:id,number,building_id']);

        return ApiResponse::success($this->present($contribution, true));
    }

    public function update(UpdateContributionRequest $request, Contribution $contribution): JsonResponse
    {
        $residence = (int) $contribution->residence_id;
        $this->assertBelongs($residence, $contribution);

        if (! $contribution->isDraft()) {
            return ApiResponse::error('Seule une cotisation à l’état brouillon peut être modifiée.', 422);
        }

        $data = $request->validated();
        $this->assertFiscalYear($residence, $data['fiscal_year_id'] ?? null);
        $buildingIds = $this->assertBuildings($residence, $data, true);

        $contribution->update(array_filter(
            $request->only([
                'type', 'name', 'fiscal_year_id', 'starts_on', 'ends_on',
                'calculation_mode', 'annual_budget', 'applies_to_all_buildings',
            ]),
            fn ($v) => $v !== null
        ));

        if (array_key_exists('fixed_rates', $data)) {
            $contribution->fixedRates()->delete();
            if (! empty($data['fixed_rates'])) {
                $contribution->fixedRates()->createMany($data['fixed_rates']);
            }
        }
        if ($buildingIds !== null) {
            $contribution->buildings()->sync($buildingIds);
        }

        return ApiResponse::success(
            $this->present($contribution->fresh(['fixedRates', 'buildings'])),
            'Cotisation mise à jour.'
        );
    }

    public function destroy(Contribution $contribution): JsonResponse
    {
        $this->assertBelongs((int) $contribution->residence_id, $contribution);

        if (! $contribution->isDraft()) {
            return ApiResponse::error('Seule une cotisation à l’état brouillon peut être supprimée.', 422);
        }

        $contribution->delete();

        return ApiResponse::success(null, 'Cotisation supprimée.');
    }

    /** Aperçu par lot (calculé, rien n’est persisté) + avertissements. */
    public function preview(Contribution $contribution): JsonResponse
    {
        $this->assertBelongs((int) $contribution->residence_id, $contribution);

        try {
            $preview = $this->generator->previewAnnuals($contribution);
        } catch (\LogicException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }

        $lots = Lot::whereIn('id', array_column($preview['rows'], 'lot_id'))
            ->with('building:id,number')
            ->get()
            ->keyBy('id');

        $rows = array_map(function ($row) use ($lots) {
            $lot = $lots->get($row['lot_id']);

            return $row + [
                'number' => $lot?->number,
                'building' => $lot?->building?->number,
                'type' => $lot?->type->value,
                'type_label' => $lot?->type_label,
                'surface' => $lot?->surface,
                'tantieme' => $lot?->tantieme,
            ];
        }, $preview['rows']);

        $warnings = [];
        foreach ($rows as $row) {
            if (($row['surface'] === null || (float) $row['surface'] <= 0) && $contribution->calculation_mode->value === 'per_surface') {
                $warnings[] = "Lot {$row['number']} : surface nulle — part à 0 €.";
            }
        }

        return ApiResponse::success([
            'rows' => array_values($rows),
            'annual_total' => $preview['annual_total'],
            'monthly_total' => $preview['monthly_total'],
            'warnings' => $warnings,
        ]);
    }

    /** Publication : fige les snapshots et génère les dus mensuels. */
    public function publish(Contribution $contribution): JsonResponse
    {
        $this->assertBelongs((int) $contribution->residence_id, $contribution);

        if (! $this->canPublish()) {
            abort(403, 'Permission contributions.publish requise.');
        }
        if (! $contribution->isDraft()) {
            return ApiResponse::error('Seule une cotisation à l’état brouillon peut être publiée.', 422);
        }

        try {
            $published = $this->generator->publish($contribution);
        } catch (\LogicException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }

        return ApiResponse::success(
            $this->present($published),
            'Cotisation publiée : dus mensuels générés.'
        );
    }

    private function assertBelongs(int $residenceId, Contribution $contribution): void
    {
        $this->scopedResidence($residenceId);
        abort_if((int) $contribution->residence_id !== (int) $residenceId, 404);
    }

    private function assertFiscalYear(int $residenceId, mixed $fiscalYearId): void
    {
        if ($fiscalYearId && ! FiscalYear::where('id', $fiscalYearId)->where('residence_id', $residenceId)->exists()) {
            abort(response()->json(['success' => false, 'data' => null, 'message' => 'Cet exercice n’appartient pas à la résidence.'], 422));
        }
    }

    /** @return int[]|null null = inchangé (update) ; [] accepté seulement si tous bâtiments */
    private function assertBuildings(int $residenceId, array $data, bool $isUpdate = false): ?array
    {
        $appliesToAll = $data['applies_to_all_buildings'] ?? ($isUpdate ? null : true);

        if ($appliesToAll === null) {
            return null;
        }
        if ($appliesToAll) {
            return [];
        }

        $ids = array_values(array_unique($data['building_ids'] ?? []));
        if ($ids === []) {
            abort(response()->json(['success' => false, 'data' => null, 'message' => 'Sélectionnez au moins un bâtiment (ou appliquez à tous).'], 422));
        }
        $valid = Building::where('residence_id', $residenceId)->whereIn('id', $ids)->pluck('id')->all();
        if (count($valid) !== count($ids)) {
            abort(response()->json(['success' => false, 'data' => null, 'message' => 'Un bâtiment n’appartient pas à la résidence.'], 422));
        }

        return $valid;
    }

    private function present(Contribution $contribution, bool $withLots = false): array
    {
        $row = [
            'id' => $contribution->id,
            'type' => $contribution->type->value,
            'type_label' => $contribution->type->label(),
            'name' => $contribution->name,
            'fiscal_year_id' => $contribution->fiscal_year_id,
            'starts_on' => $contribution->starts_on,
            'ends_on' => $contribution->ends_on,
            'calculation_mode' => $contribution->calculation_mode->value,
            'calculation_mode_label' => $contribution->calculation_mode->label(),
            'annual_budget' => $contribution->annual_budget,
            'coefficient' => $contribution->coefficient,
            'applies_to_all_buildings' => (bool) $contribution->applies_to_all_buildings,
            'status' => $contribution->status->value,
            'status_label' => $contribution->status->label(),
            'published_at' => $contribution->published_at,
            'contribution_lots_count' => $contribution->contribution_lots_count ?? $contribution->contributionLots()->count(),
            'fixed_rates' => $contribution->relationLoaded('fixedRates') ? $contribution->fixedRates : null,
            'buildings' => $contribution->relationLoaded('buildings')
                ? $contribution->buildings->map(fn ($b) => ['id' => $b->id, 'number' => $b->number])->all()
                : null,
        ];

        if ($withLots) {
            $row['contribution_lots'] = $contribution->contributionLots->map(fn ($cl) => [
                'lot_id' => $cl->lot_id,
                'number' => $cl->lot?->number,
                'annual_amount' => $cl->annual_amount,
                'monthly_amount' => $cl->monthly_amount,
            ])->all();
        }

        return $row;
    }
}
