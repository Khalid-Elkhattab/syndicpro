<?php

namespace App\Http\Controllers\Coproprietaires;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Resources\AppartementResource;
use App\Repositories\AppartementRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AppartementController extends Controller
{
    public function __construct(
        private AppartementRepository $appartementRepo
    ) {}

    public function index(): JsonResponse
    {
        $appartements = $this->appartementRepo->findByCoproprietaires(Auth::id());

        return ApiResponse::success(
            AppartementResource::collection($appartements)
        );
    }
}