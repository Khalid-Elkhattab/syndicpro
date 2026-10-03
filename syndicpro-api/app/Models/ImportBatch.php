<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImportBatch extends Model
{
    protected $fillable = [
        'residence_id', 'type', 'file_path', 'status', 'rows_total',
        'rows_imported', 'dry_run', 'summary', 'errors', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'dry_run' => 'boolean',
            'summary' => 'array',
            'errors' => 'array',
        ];
    }
}
