<?php

namespace App\Http\Controllers\Syndic;

use App\Enums\QuitusStatus;
use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\Syndic\IssueSaleQuitusRequest;
use App\Models\Lot;
use App\Models\QuitusCertificate;
use App\Policies\QuitusPolicy;
use App\Services\QuitusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuitusController extends Controller
{
    public function __construct(
        private QuitusService $quitus,
        private QuitusPolicy $policy,
    ) {}

    public function issue(IssueSaleQuitusRequest $request): JsonResponse
    {
        if (! $this->policy->issue($request->user())) {
            abort(403, 'Permission quitus.issue requise.');
        }

        $lot = Lot::findOrFail($request->input('lot_id'));

        try {
            $certificate = $this->quitus->issue(
                $lot->residence_id,
                (int) $request->input('owner_id'),
                $lot->id,
                $request->input('purpose', 'sale'),
                $request->user()->id,
            );
        } catch (\LogicException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }

        return ApiResponse::success($certificate, 'Quitus émis.', 201);
    }

    public function cancel(Request $request, QuitusCertificate $quitus): JsonResponse
    {
        if (! $this->policy->issue($request->user())) {
            abort(403, 'Permission quitus.issue requise.');
        }
        $request->validate(['cancel_reason' => 'required|string|max:1000']);

        $quitus->update([
            'status' => QuitusStatus::Cancelled->value,
            'cancel_reason' => $request->input('cancel_reason'),
        ]);

        return ApiResponse::success($quitus, 'Quitus annulé.');
    }
}
