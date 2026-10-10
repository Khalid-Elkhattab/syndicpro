<?php

namespace App\Http\Controllers\Syndic;

use App\Enums\LawyerCaseStatus;
use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\LawyerCase;
use App\Models\LotOwnership;
use App\Models\LotTransfer;
use App\Models\Owner;
use App\Services\OwnerSituationService;
use App\Services\SettingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Juridique / recouvrement : une seule liste avec toutes les informations —
 * impayés (motif auto selon ancienneté), transferts sans quitus, dossiers avocat
 * (nature du cas + motif + workflow).
 */
class LegalController extends Controller
{
    /** Vue d’ensemble : propriétaires en impayé avec motif et ancienneté. */
    public function overview(Request $request): JsonResponse
    {
        $request->validate(['residence_id' => 'required|exists:residences,id']);
        $residenceId = (int) $request->input('residence_id');

        $lawyerMonths = (int) SettingService::get('lawyer_after_months');
        $formalMonths = (int) SettingService::get('formal_notice_after_months');

        $ownerIds = LotOwnership::whereHas('lot', fn ($q) => $q->where('residence_id', $residenceId))
            ->distinct()->pluck('owner_id');

        $rows = [];
        foreach ($ownerIds as $ownerId) {
            $situation = OwnerSituationService::forOwner($ownerId);
            if ($situation['remaining'] <= 0) {
                continue;
            }
            $owner = Owner::with(['phones'])->find($ownerId);
            if (! $owner) {
                continue;
            }

            $monthsLate = $situation['oldest_unpaid']
                ? max(0, (int) today()->diffInMonths(Carbon::parse($situation['oldest_unpaid'])->startOfDay()))
                : 0;

            $existingCase = LawyerCase::where('owner_id', $ownerId)
                ->where('residence_id', $residenceId)
                ->whereIn('status', ['to_transmit', 'transmitted', 'in_progress'])
                ->latest()->first();

            $rows[] = [
                'owner' => [
                    'id' => $owner->id,
                    'display_name' => $owner->display_name,
                    'phone' => $owner->phones->firstWhere('is_primary', true)?->number
                        ?? $owner->phones->first()?->number,
                ],
                'lots' => $situation['per_lot'],
                'amount_due' => $situation['remaining'],
                'overdue' => $situation['overdue'],
                'oldest_unpaid' => $situation['oldest_unpaid'],
                'months_late' => $monthsLate,
                'motif' => $this->unpaidMotif($situation['remaining'], $monthsLate, $formalMonths, $lawyerMonths),
                'case_kind' => 'unpaid_dues',
                'escalate' => $monthsLate >= $lawyerMonths,
                'lawyer_case' => $existingCase ? [
                    'id' => $existingCase->id,
                    'status' => $existingCase->status->value,
                    'motif' => $existingCase->motif,
                ] : null,
            ];
        }

        usort($rows, fn ($a, $b) => $b['months_late'] <=> $a['months_late']);

        return ApiResponse::success([
            'rows' => $rows,
            'total' => count($rows),
            'total_amount' => round(array_sum(array_column($rows, 'amount_due')), 2),
            'thresholds' => [
                'formal_notice_after_months' => $formalMonths,
                'lawyer_after_months' => $lawyerMonths,
            ],
        ]);
    }

    /** Transferts effectués sans quitus → mesure légale (avec motif). */
    public function transfersWithoutQuitus(Request $request): JsonResponse
    {
        $request->validate(['residence_id' => 'required|exists:residences,id']);

        $transfers = LotTransfer::where('residence_id', $request->input('residence_id'))
            ->whereNull('quitus_id')
            ->with(['fromOwner:id,first_name,last_name,company_name,type', 'toOwner:id,first_name,last_name,company_name,type', 'lot:id,number,building_id', 'lot.building:id,number', 'lawyerCase'])
            ->latest('effective_on')
            ->paginate(min((int) $request->input('per_page', 20), 100));

        $items = collect($transfers->items())->map(function ($t) {
            return [
                'id' => $t->id,
                'lot' => $t->lot ? "Lot {$t->lot->number} (imm. {$t->lot->building?->number})" : "Lot #{$t->lot_id}",
                'lot_id' => $t->lot_id,
                'from_owner' => $t->fromOwner?->display_name,
                'to_owner' => $t->toOwner?->display_name,
                'effective_on' => $t->effective_on,
                'reason' => $t->reason->value,
                'balance_at_transfer' => $t->balance_at_transfer,
                'case_kind' => 'no_quitus_transfer',
                'motif' => $t->lawyerCase?->motif ?? 'Transfert sans quitus de vente.',
                'lawyer_case' => $t->lawyerCase ? [
                    'id' => $t->lawyerCase->id,
                    'status' => $t->lawyerCase->status->value,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $items,
            'message' => 'Succès.',
            'meta' => [
                'current_page' => $transfers->currentPage(),
                'last_page' => $transfers->lastPage(),
                'per_page' => $transfers->perPage(),
                'total' => $transfers->total(),
            ],
        ]);
    }

    /** Dossiers avocat : nature du cas + motif + workflow. */
    public function lawyerCases(Request $request): JsonResponse
    {
        $request->validate(['residence_id' => 'required|exists:residences,id']);

        $query = LawyerCase::where('residence_id', $request->input('residence_id'))
            ->with(['owner:id,first_name,last_name,company_name,type', 'lot:id,number,building_id', 'lot.building:id,number'])
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('case_kind'), fn ($q, $k) => $q->where('case_kind', $k))
            ->latest();

        $perPage = min((int) $request->input('per_page', 20), 100);
        $result = $query->paginate($perPage);

        $items = collect($result->items())->map(fn ($c) => $this->presentCase($c));

        return response()->json([
            'success' => true,
            'data' => $items,
            'message' => 'Succès.',
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    /** Création manuelle d’un dossier (ex. impayé → juridique). */
    public function storeLawyerCase(Request $request): JsonResponse
    {
        $data = $request->validate([
            'residence_id' => 'required|exists:residences,id',
            'owner_id' => 'required|exists:owners,id',
            'lot_id' => 'nullable|exists:lots,id',
            'case_kind' => ['required', Rule::in(['unpaid_dues', 'no_quitus_transfer', 'other'])],
            'motif' => 'required|string|max:1000',
            'amount_claimed' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:2000',
        ], [
            'motif.required' => 'Le motif est obligatoire (pourquoi ce dossier part au juridique).',
        ]);

        $case = LawyerCase::create([
            'residence_id' => $data['residence_id'],
            'owner_id' => $data['owner_id'],
            'lot_id' => $data['lot_id'] ?? null,
            'case_kind' => $data['case_kind'],
            'motif' => $data['motif'],
            'amount_claimed' => $data['amount_claimed'],
            'status' => LawyerCaseStatus::ToTransmit->value,
            'notes' => $data['notes'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        return ApiResponse::success($this->presentCase($case->fresh()), 'Dossier juridique créé.', 201);
    }

    /** Workflow : to_transmit → transmitted → in_progress → closed. */
    public function updateLawyerCaseStatus(Request $request, LawyerCase $lawyerCase): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::enum(LawyerCaseStatus::class)],
            'notes' => 'nullable|string|max:2000',
        ]);

        $order = ['to_transmit' => 0, 'transmitted' => 1, 'in_progress' => 2, 'closed' => 3];
        $current = $lawyerCase->status instanceof LawyerCaseStatus ? $lawyerCase->status->value : (string) $lawyerCase->status;

        if ($order[$data['status']] < $order[$current] && $data['status'] !== 'to_transmit') {
            return ApiResponse::error('Transition de statut interdite (retour en arrière).', 422);
        }

        $lawyerCase->update([
            'status' => $data['status'],
            'notes' => $data['notes'] ?? $lawyerCase->notes,
            'exported_at' => $data['status'] === 'transmitted' ? now() : $lawyerCase->exported_at,
            'updated_by' => $request->user()->id,
        ]);

        return ApiResponse::success($this->presentCase($lawyerCase->fresh()), 'Statut du dossier mis à jour.');
    }

    private function unpaidMotif(float $amount, int $monthsLate, int $formalMonths, int $lawyerMonths): string
    {
        $base = "Impayés de {$amount} MAD";
        if ($monthsLate >= $lawyerMonths) {
            return "{$base} depuis {$monthsLate} mois — à transmettre au juridique.";
        }
        if ($monthsLate >= $formalMonths) {
            return "{$base} depuis {$monthsLate} mois — mise en demeure requise.";
        }

        return "{$base} depuis {$monthsLate} mois — relance requise.";
    }

    private function presentCase(LawyerCase $c): array
    {
        $kinds = [
            'unpaid_dues' => 'Impayés',
            'no_quitus_transfer' => 'Transfert sans quitus',
            'other' => 'Autre',
        ];

        return [
            'id' => $c->id,
            'owner' => $c->relationLoaded('owner') && $c->owner ? [
                'id' => $c->owner->id, 'display_name' => $c->owner->display_name,
            ] : ['id' => $c->owner_id],
            'lot' => $c->relationLoaded('lot') && $c->lot
                ? "Lot {$c->lot->number} (imm. {$c->lot->building?->number})" : null,
            'transfer_id' => $c->transfer_id,
            'case_kind' => $c->case_kind,
            'case_kind_label' => $kinds[$c->case_kind] ?? $c->case_kind,
            'motif' => $c->motif,
            'amount_claimed' => $c->amount_claimed,
            'status' => $c->status instanceof LawyerCaseStatus ? $c->status->value : $c->status,
            'notes' => $c->notes,
            'exported_at' => $c->exported_at,
            'created_at' => $c->created_at?->format('d/m/Y'),
        ];
    }
}
