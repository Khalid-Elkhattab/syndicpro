<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\Document;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class DocumentController extends Controller
{
    public function __construct(private DocumentService $documents) {}

    /** Documents d’une résidence (filtres : type, recherche). */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'residence_id' => 'required|exists:residences,id',
            'type' => 'nullable|string|max:60',
            'search' => 'nullable|string|max:100',
        ]);

        $query = Document::where('residence_id', $request->input('residence_id'))
            ->with(['creator:id,name'])
            ->when($request->input('type'), fn ($q, $type) => $q->where('type', $type))
            ->when($request->input('search'), fn ($q, $s) => $q->where(function ($qq) use ($s) {
                $qq->where('title', 'like', "%{$s}%")->orWhere('number', 'like', "%{$s}%");
            }))
            ->latest();

        $perPage = min((int) $request->input('per_page', 20), 100);
        $result = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $result->items(),
            'message' => 'Succès.',
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    /** Téléversement d’un document pour une résidence. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'residence_id' => 'required|exists:residences,id',
            'building_id' => 'nullable|exists:buildings,id',
            'owner_id' => 'nullable|exists:owners,id',
            'lot_id' => 'nullable|exists:lots,id',
            'type' => ['required', 'string', 'max:60', Rule::in(DocumentService::allowedTypeCodes())],
            'title' => 'nullable|string|max:200',
            'locale' => 'nullable|in:fr,ar',
            'visibility' => 'nullable|in:staff,owner,residence',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ], [
            'type.in' => 'Type de document inconnu.',
            'file.required' => 'Un fichier est requis.',
            'file.mimes' => 'Formats acceptés : PDF, JPG, PNG.',
            'file.max' => 'Fichier trop volumineux (10 Mo max).',
        ]);

        $document = $this->documents->storeUploaded($data, $request->file('file'), $request->user()->id);
        $document->load(['creator:id,name']);

        return ApiResponse::success($document, 'Document enregistré.', 201);
    }

    public function download(Document $document)
    {
        $disk = $document->disk ?: 'local';
        if (! Storage::disk($disk)->exists($document->path)) {
            return ApiResponse::error('Fichier introuvable sur le disque.', 404);
        }

        return Storage::disk($disk)->download(
            $document->path,
            $document->title
        );
    }

    public function destroy(Document $document): JsonResponse
    {
        try {
            $this->documents->delete($document);
        } catch (\LogicException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }

        return ApiResponse::success(null, 'Document supprimé.');
    }
}
