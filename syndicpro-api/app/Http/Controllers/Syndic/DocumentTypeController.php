<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\Document;
use App\Models\DocumentType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DocumentTypeController extends Controller
{
    /** Tous les types actifs (système + personnalisés) pour les listes déroulantes. */
    public function index(): JsonResponse
    {
        $types = DocumentType::active()->orderBy('is_system', 'desc')->orderBy('label_fr')->get();

        return ApiResponse::success($types);
    }

    /** Le syndic ajoute un nouveau type de document personnalisé. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'label_fr' => 'required|string|max:100',
            'label_ar' => 'nullable|string|max:100',
        ], [
            'label_fr.required' => 'Le libellé français est obligatoire.',
        ]);

        $code = Str::slug($data['label_fr'], '_');
        $base = $code;
        $i = 2;
        while (DocumentType::where('code', $code)->exists()) {
            $code = "{$base}_{$i}";
            $i++;
        }

        $type = DocumentType::create([
            'code' => $code,
            'label_fr' => $data['label_fr'],
            'label_ar' => $data['label_ar'] ?? null,
            'is_system' => false,
            'is_active' => true,
            'created_by' => $request->user()->id,
        ]);

        return ApiResponse::success($type, 'Type de document ajouté.', 201);
    }

    public function update(Request $request, DocumentType $documentType): JsonResponse
    {
        if ($documentType->is_system) {
            return ApiResponse::error('Un type système ne peut pas être modifié.', 422);
        }

        $data = $request->validate([
            'label_fr' => 'sometimes|required|string|max:100',
            'label_ar' => 'nullable|string|max:100',
            'is_active' => 'sometimes|boolean',
        ]);

        $documentType->update($data);

        return ApiResponse::success($documentType->fresh(), 'Type de document mis à jour.');
    }

    public function destroy(DocumentType $documentType): JsonResponse
    {
        if ($documentType->is_system) {
            return ApiResponse::error('Un type système ne peut pas être supprimé.', 422);
        }

        if (Document::where('type', $documentType->code)->exists()) {
            return ApiResponse::error('Ce type est utilisé par des documents existants. Désactivez-le plutôt.', 422);
        }

        $documentType->delete();

        return ApiResponse::success(null, 'Type de document supprimé.');
    }
}
