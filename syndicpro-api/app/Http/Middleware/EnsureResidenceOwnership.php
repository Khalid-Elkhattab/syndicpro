<?php

namespace App\Http\Middleware;

use App\Http\Helpers\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureResidenceOwnership
{
    public function handle(Request $request, Closure $next): Response
    {
        $residenceId = $request->route('residence');
        
        if ($residenceId) {
            $residence = \App\Models\Residence::find($residenceId);
            
            if (!$residence || $residence->syndic_id !== auth()->id()) {
                return ApiResponse::forbidden('Accès non autorisé à cette résidence.');
            }
        }

        return $next($request);
    }
}