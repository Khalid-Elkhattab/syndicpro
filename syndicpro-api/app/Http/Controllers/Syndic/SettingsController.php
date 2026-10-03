<?php

namespace App\Http\Controllers\Syndic;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $defaults = SettingService::DEFAULTS;

        $settings = collect(SettingService::all())->map(fn ($value, $key) => [
            'key' => $key,
            'value' => $value,
            'default' => $defaults[$key],
        ])->values();

        return ApiResponse::success($settings);
    }

    /** Mise à jour en masse : { "settings": { "cle": valeur, ... } }. */
    public function update(Request $request): JsonResponse
    {
        $request->validate(['settings' => 'required|array']);

        $rules = [];
        foreach ((array) $request->input('settings', []) as $key => $value) {
            if (! array_key_exists($key, SettingService::RULES)) {
                return ApiResponse::error("Réglage inconnu : {$key}.", 422);
            }
            $rules["settings.{$key}"] = SettingService::RULES[$key];
        }

        Validator::make($request->all(), $rules, [
            'integer' => 'Le champ :attribute doit être un nombre entier.',
            'min' => 'Le champ :attribute est trop petit.',
            'max' => 'Le champ :attribute est trop grand.',
        ])->validate();

        foreach ((array) $request->input('settings', []) as $key => $value) {
            SettingService::set($key, (int) $value);
        }

        return ApiResponse::success(SettingService::all(), 'Réglages enregistrés.');
    }
}
