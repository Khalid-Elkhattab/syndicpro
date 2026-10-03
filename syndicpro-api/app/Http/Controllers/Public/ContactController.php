<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\ContactRequest;
use App\Services\InquiryService;
use Illuminate\Http\JsonResponse;

class ContactController extends Controller
{
    public function __construct(
        private InquiryService $inquiries
    ) {}

    public function store(ContactRequest $request): JsonResponse
    {
        $inquiry = $this->inquiries->store([
            'type' => 'contact',
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'phone' => $request->input('phone'),
            'message' => $request->input('message'),
            'details' => [],
            'locale' => $request->input('locale', 'fr'),
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'message' => $request->input('locale') === 'ar'
                ? 'شكرًا! تم استلام رسالتك وسنعاود الاتصال بك.'
                : 'Merci ! Votre message a bien été reçu, nous vous recontacterons.',
            'reference' => 'INQ-'.$inquiry->id,
        ], 201);
    }
}
