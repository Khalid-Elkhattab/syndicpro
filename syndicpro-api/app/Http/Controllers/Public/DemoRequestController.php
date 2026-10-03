<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\DemoRequest;
use App\Services\InquiryService;
use Illuminate\Http\JsonResponse;

class DemoRequestController extends Controller
{
    public function __construct(
        private InquiryService $inquiries
    ) {}

    public function store(DemoRequest $request): JsonResponse
    {
        $inquiry = $this->inquiries->store([
            'type' => 'demo',
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'phone' => $request->input('phone'),
            'message' => $request->input('message'),
            'details' => [
                'organization' => $request->input('organization'),
                'role' => $request->input('role'),
                'residences_count' => $request->input('residences_count'),
                'lots_count' => $request->input('lots_count'),
                'current_tool' => $request->input('current_tool'),
            ],
            'locale' => $request->input('locale', 'fr'),
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'message' => $request->input('locale') === 'ar'
                ? 'شكرًا! تم استلام طلب العرض التجريبي وسنعاود الاتصال بك.'
                : 'Merci ! Votre demande de démo a bien été reçue, nous vous recontacterons.',
            'reference' => 'INQ-'.$inquiry->id,
        ], 201);
    }
}
