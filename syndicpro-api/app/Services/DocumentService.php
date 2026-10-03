<?php

namespace App\Services;

use App\Enums\DocumentSource;
use App\Enums\DocumentStatus;
use App\Enums\DocumentType as DocumentTypeEnum;
use App\Models\Document;
use App\Models\DocumentType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DocumentService
{
    /** Codes de type acceptés : enum système + types personnalisés actifs. */
    public static function allowedTypeCodes(): array
    {
        $enum = array_map(fn ($c) => $c->value, DocumentTypeEnum::cases());
        $custom = DocumentType::active()->where('is_system', false)->pluck('code')->all();

        return array_values(array_unique(array_merge($enum, $custom)));
    }

    /**
     * Enregistre un fichier téléversé comme document officiel de la résidence.
     */
    public function storeUploaded(array $data, UploadedFile $file, int $createdBy): Document
    {
        return DB::transaction(function () use ($data, $file, $createdBy) {
            $residenceId = (int) $data['residence_id'];
            $path = $file->store("documents/{$residenceId}", 'local');

            $document = Document::create([
                'residence_id' => $residenceId,
                'building_id' => $data['building_id'] ?? null,
                'owner_id' => $data['owner_id'] ?? null,
                'lot_id' => $data['lot_id'] ?? null,
                'type' => $data['type'],
                'source' => DocumentSource::Uploaded->value,
                'status' => DocumentStatus::Final->value,
                'title' => $data['title'] ?? $file->getClientOriginalName(),
                'locale' => $data['locale'] ?? 'fr',
                'visibility' => $data['visibility'] ?? 'staff',
                'disk' => 'local',
                'path' => $path,
                'mime' => $file->getMimeType(),
                'size' => $file->getSize(),
                'checksum' => hash_file('sha256', $file->getRealPath()),
                'meta' => $data['meta'] ?? null,
                'created_by' => $createdBy,
                'generated_at' => now(),
            ]);

            $document->update([
                'number' => NumberSequenceService::next($residenceId, 'document', (int) date('Y'), 'DOC'),
            ]);

            return $document->fresh();
        });
    }

    public function delete(Document $document): void
    {
        if ($document->is_locked) {
            throw new \LogicException('Document verrouillé : suppression interdite.');
        }

        DB::transaction(function () use ($document) {
            Storage::disk($document->disk)->delete($document->path);
            $document->delete();
        });
    }
}
