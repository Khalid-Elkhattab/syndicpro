<?php

namespace Database\Seeders;

use App\Enums\DocumentType as DocumentTypeEnum;
use App\Models\DocumentType;
use Illuminate\Database\Seeder;

class DocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        foreach (DocumentTypeEnum::cases() as $case) {
            DocumentType::firstOrCreate(
                ['code' => $case->value],
                [
                    'label_fr' => $case->frenchLabel(),
                    'is_system' => true,
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('✓ DocumentTypeSeeder: ' . count(DocumentTypeEnum::cases()) . ' types système');
    }
}
