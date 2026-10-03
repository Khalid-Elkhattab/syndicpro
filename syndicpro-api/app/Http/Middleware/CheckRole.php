<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Http\Helpers\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Rôles acceptés séparés par des virgules, ex. `role:syndic,assistant`.
     * Les logins copropriétaires (type=owner) n’accèdent qu’aux routes `coproprietaire`.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return ApiResponse::forbidden('Accès non autorisé.');
        }

        $userRole = $user->role instanceof UserRole ? $user->role->value : (string) $user->role;
        $allowed = array_map('trim', $roles);

        if (! in_array($userRole, $allowed, true)) {
            return ApiResponse::forbidden('Accès non autorisé. Rôle requis : ' . implode(',', $allowed));
        }

        $isOwnerLogin = method_exists($user, 'isOwner') && $user->isOwner();
        if ($isOwnerLogin && ! in_array(UserRole::Coproprietaire->value, $allowed, true)) {
            return ApiResponse::forbidden('Espace réservé au staff.');
        }

        return $next($request);
    }
}