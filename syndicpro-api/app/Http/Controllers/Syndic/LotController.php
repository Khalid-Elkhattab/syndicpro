<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Models\Lot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LotController extends Controller
{
    /** Lots d’une résidence (sélecteur du wizard, filtres, recherche). */
    public function index(Request $request): JsonResponse
    {
        $request->validate(['residence_id' => 'required|exists:residences,id']);

        $query = Lot::where('residence_id', $request->input('residence_id'))
            ->with(['building:id,number,residence_id', 'currentOwnerships.owner'])
            ->when($request->input('search'), fn ($q, $s) => $q->where('number', 'like', "%{$s}%"))
            ->when($request->input('type'), fn ($q, $t) => $q->where('type', $t))
            ->orderBy('number');

        $perPage = min((int) $request->input('per_page', 50), 100);
        $result = $query->paginate($perPage);

        $items = collect($result->items())->map(fn ($lot) => [
            'id' => $lot->id,
            'number' => $lot->number,
            'type' => $lot->type->value,
            'type_label' => $lot->type_label,
            'surface' => $lot->surface,
            'tantieme' => $lot->tantieme,
            'building_id' => $lot->building_id,
            'building' => $lot->building?->number,
            'current_owner' => $lot->currentOwnerships->first()?->owner?->display_name,
        ]);

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
}
