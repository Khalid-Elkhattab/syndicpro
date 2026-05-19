<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Http\Helpers\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (!$user) {
            return ApiResponse::forbidden('Accès non autorisé. Rôle requis : ' . $role);
        }

        $userRole = $user->role instanceof UserRole ? $user->role->value : $user->role;

        if ($userRole !== $role) {
            return ApiResponse::forbidden('Accès non autorisé. Rôle requis : ' . $role);
        }

        return $next($request);
    }
}