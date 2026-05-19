<?php

namespace App\Http\Controllers\Coproprietaires;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Resources\CotisationDetailResource;
use App\Models\CotisationDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CotisationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = Auth::id();

        $perPage = min($request->get('per_page', 20), 100);

        $query = CotisationDetail::where('coproprietaire_id', $userId)
            ->with(['cotisation', 'paiements', 'appartement']);

        if ($request->filled('type')) {
            $query->whereHas('cotisation', function ($q) use ($request) {
                $q->where('type', $request->type);
            });
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        $cotisations = $query->orderByDesc('created_at')->paginate($perPage);

        return ApiResponse::success(
            CotisationDetailResource::collection($cotisations),
            message: 'Liste des cotisations récupérée avec succès.',
            meta: [
                'current_page' => $cotisations->currentPage(),
                'last_page' => $cotisations->lastPage(),
                'per_page' => $cotisations->perPage(),
                'total' => $cotisations->total(),
            ]
        );
    }

    public function show(CotisationDetail $detail): JsonResponse
    {
        if ($detail->coproprietaire_id !== Auth::id()) {
            return ApiResponse::forbidden('Vous n\'êtes pas autorisé à voir cette cotisation.');
        }

        return ApiResponse::success(
            CotisationDetailResource::make($detail->load(['cotisation', 'paiements', 'appartement']))
        );
    }
}