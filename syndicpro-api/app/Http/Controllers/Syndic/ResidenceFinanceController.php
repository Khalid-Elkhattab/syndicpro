<?php

namespace App\Http\Controllers\Syndic;

use App\Enums\CalculationMode;
use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\Residence\FinanceResidenceRequest;
use App\Models\Assembly;
use App\Models\FiscalYear;
use App\Models\Residence;
use Illuminate\Http\JsonResponse;

class ResidenceFinanceController extends Controller
{
    /**
     * Paramètres financiers d'une résidence : défaut + décisions annuelles AG/PV.
     */
    public function show(int $residence): JsonResponse
    {
        $residenceModel = Residence::where('id', $residence)
            ->where('syndic_id', auth()->id())
            ->first();

        if (! $residenceModel) {
            return ApiResponse::notFound();
        }

        $fiscalYears = FiscalYear::where('residence_id', $residenceModel->id)
            ->with(['decidingAssembly:id,residence_id,title,scheduled_at,status'])
            ->orderByDesc('starts_on')
            ->get()
            ->map(fn ($fy) => [
                'id' => $fy->id,
                'name' => $fy->name,
                'starts_on' => $fy->starts_on,
                'ends_on' => $fy->ends_on,
                'status' => $fy->status,
                'calculation_mode' => $fy->calculation_mode?->value,
                'calculation_mode_label' => $fy->calculation_mode?->label(),
                'calculation_mode_decided_at' => $fy->calculation_mode_decided_at,
                'assembly' => $fy->decidingAssembly ? [
                    'id' => $fy->decidingAssembly->id,
                    'title' => $fy->decidingAssembly->title,
                    'scheduled_at' => $fy->decidingAssembly->scheduled_at,
                    'status' => $fy->decidingAssembly->status,
                ] : null,
            ]);

        $assemblies = Assembly::where('residence_id', $residenceModel->id)
            ->orderByDesc('scheduled_at')
            ->limit(20)
            ->get(['id', 'title', 'scheduled_at', 'status']);

        $defaultMode = $residenceModel->calculation_mode instanceof CalculationMode
            ? $residenceModel->calculation_mode
            : CalculationMode::tryFrom((string) $residenceModel->calculation_mode);

        return ApiResponse::success([
            'residence' => [
                'id' => $residenceModel->id,
                'nom' => $residenceModel->nom,
                'code' => $residenceModel->code,
                'calculation_mode' => $defaultMode?->value,
                'calculation_mode_label' => $defaultMode?->label(),
                'arrears_on_sale' => $residenceModel->arrears_on_sale,
                'quitus_validity_days' => $residenceModel->quitus_validity_days,
            ],
            'fiscal_years' => $fiscalYears,
            'assemblies' => $assemblies,
            'modes' => CalculationMode::options(),
        ]);
    }

    /**
     * Enregistre le défaut résidence et/ou la décision annuelle votée en AG.
     */
    public function update(FinanceResidenceRequest $request, int $residence): JsonResponse
    {
        $residenceModel = Residence::where('id', $residence)
            ->where('syndic_id', auth()->id())
            ->firstOrFail();

        $data = $request->validated();

        $residenceModel->update(array_filter(
            $request->only(['calculation_mode', 'arrears_on_sale', 'quitus_validity_days']),
            fn ($v) => $v !== null
        ));

        $recorded = null;
        if (! empty($data['fiscal_year_id'])) {
            $fiscalYear = FiscalYear::where('id', $data['fiscal_year_id'])
                ->where('residence_id', $residenceModel->id)
                ->firstOrFail();

            $assemblyId = $data['assembly_id'] ?? null;
            if ($assemblyId && ! Assembly::where('id', $assemblyId)
                ->where('residence_id', $residenceModel->id)->exists()) {
                return ApiResponse::error('Cette AG n’appartient pas à la résidence.', 422);
            }

            $fiscalYear->update([
                'calculation_mode' => $data['year_calculation_mode'],
                'calculation_mode_decided_at' => now(),
                'assembly_id' => $assemblyId,
            ]);
            $recorded = $fiscalYear->fresh(['decidingAssembly']);
        }

        return ApiResponse::success([
            'residence' => $residenceModel->fresh(),
            'fiscal_year' => $recorded,
        ], 'Paramètres financiers enregistrés.');
    }
}
