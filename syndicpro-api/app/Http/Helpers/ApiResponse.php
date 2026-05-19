<?php

namespace App\Http\Helpers;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class ApiResponse
{
    public static function success(mixed $data = null, string $message = 'Succès.', int $status = 200, ?array $meta = null): JsonResponse
    {
        $response = [
            'success' => true,
            'data' => $data,
            'message' => $message,
        ];
        if ($meta !== null) {
            $response['meta'] = $meta;
        }
        return response()->json($response, $status);
    }

    public static function created(mixed $data = null, string $message = 'Créé avec succès.'): JsonResponse
    {
        return self::success($data, $message, 201);
    }

    public static function error(string $message, int $status = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data' => null,
            'message' => $message,
        ], $status);
    }

    public static function notFound(string $message = 'Ressource introuvable.'): JsonResponse
    {
        return self::error($message, 404);
    }

    public static function forbidden(string $message = 'Accès non autorisé.'): JsonResponse
    {
        return self::error($message, 403);
    }

    public static function validationError(array $errors): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data' => null,
            'message' => 'Les données soumises sont invalides.',
            'errors' => $errors,
        ], 422);
    }

    public static function paginated(LengthAwarePaginator $paginator, string $resourceClass): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $resourceClass::collection($paginator->items()),
            'message' => 'Succès.',
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}