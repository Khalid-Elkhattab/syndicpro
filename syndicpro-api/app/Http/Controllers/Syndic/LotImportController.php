<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Requests\LotImportRequest;
use App\Models\Residence;
use App\Services\LotImportService;

class LotImportController extends Controller
{
    public function __construct(private LotImportService $imports) {}

    /** Dry-run : analyse sans rien créer. */
    public function preview(LotImportRequest $request, Residence $residence)
    {
        $result = $this->imports->preview($residence->id, $request->file('file'));

        return response()->json(['data' => $result]);
    }

    /** Commit : 1 transaction, miroir legacy immeubles/appartements inclus. */
    public function commit(LotImportRequest $request, Residence $residence)
    {
        try {
            $result = $this->imports->commit($residence->id, $request->file('file'));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $result], 201);
    }
}
