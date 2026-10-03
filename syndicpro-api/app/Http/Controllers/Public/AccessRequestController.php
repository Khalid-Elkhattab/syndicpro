<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\SendPhoneCodeRequest;
use App\Http\Requests\SubmitAccessRequestRequest;
use App\Models\AccountRequest;
use App\Rules\E164Phone;
use App\Services\AccessRequestService;
use App\Services\PhoneVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccessRequestController extends Controller
{
    /** Message unique, que le lot/CIN existe ou non (anti-énumération). */
    public const GENERIC_MESSAGE = 'Demande envoyée. Le syndic vérifiera vos informations et vous contactera.';

    public function __construct(
        private AccessRequestService $requests,
        private PhoneVerificationService $phones,
    ) {}

    public function sendCode(SendPhoneCodeRequest $request): JsonResponse
    {
        $this->phones->send($request->input('phone'), 'access_request', $request->ip());

        return ApiResponse::success(null, 'Si ce numéro est valide, un code vient d’être envoyé.');
    }

    public function verifyCode(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string', new E164Phone],
            'code' => ['required', 'string', 'size:6'],
        ]);

        if (! $this->phones->verify($request->input('phone'), $request->input('code'))) {
            return ApiResponse::error('Code invalide ou expiré.', 422);
        }

        return ApiResponse::success(null, 'Numéro vérifié.');
    }

    public function submit(SubmitAccessRequestRequest $request): JsonResponse
    {
        $phone = E164Phone::normalize($request->input('phone'));

        // Limites anti-abus : 5/h par IP, 3/j par CIN.
        $ipCount = AccountRequest::where('ip', $request->ip())
            ->where('created_at', '>=', now()->subHour())->count();
        $cinCount = AccountRequest::where('identity_number', $request->input('identity_number'))
            ->where('created_at', '>=', now()->subDay())->count();

        if ($ipCount >= 5 || $cinCount >= 3) {
            return ApiResponse::success(null, self::GENERIC_MESSAGE, 201);
        }

        // Une seule demande ouverte par lot + CIN.
        $match = $this->requests->match(
            (int) $request->input('residence_id'),
            $request->input('building_input'),
            $request->input('lot_input'),
            $request->input('identity_number')
        );
        $openExists = AccountRequest::open()
            ->where('identity_number', $request->input('identity_number'))
            ->when($match['lot_id'], fn ($q) => $q->where('lot_id', $match['lot_id']))
            ->exists();

        if ($openExists) {
            return ApiResponse::success(null, self::GENERIC_MESSAGE, 201);
        }

        if (! $this->phones->isVerified($phone)) {
            return ApiResponse::error('Vérifiez d’abord votre numéro via le code reçu.', 422);
        }

        $accountRequest = $this->requests->submit(
            (int) $request->input('residence_id'),
            array_merge($request->validated(), ['phone_verified_at' => now()]),
            $request->ip()
        );

        if ($request->hasFile('proof')) {
            $accountRequest->addMediaFromRequest('proof')->toMediaCollection('proof');
        }

        return ApiResponse::success(null, self::GENERIC_MESSAGE, 201);
    }
}
