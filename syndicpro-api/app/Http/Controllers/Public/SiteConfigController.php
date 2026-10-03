<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Configuration publique du site (nom, contact, liens, flags).
 * Tout ce qui est null est masqué côté vitrine — jamais de fausse donnée.
 */
class SiteConfigController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'name' => config('site.name'),
            'tagline' => config('site.tagline'),
            'contact' => config('site.contact'),
            'links' => config('site.links'),
            'features' => config('site.features'),
            'plans' => config('site.plans', []),
        ])->header('Cache-Control', 'public, max-age=300');
    }
}
