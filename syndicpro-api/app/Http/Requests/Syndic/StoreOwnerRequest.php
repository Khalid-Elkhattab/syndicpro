<?php

namespace App\Http\Requests\Syndic;

use App\Rules\E164Phone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOwnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policy dans le contrôleur
    }

    public function rules(): array
    {
        return [
            'type' => ['nullable', Rule::in(['individual', 'company'])],
            'first_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'company_name' => ['nullable', 'string', 'max:150'],
            'identity_number' => ['nullable', 'string', 'max:30'],
            'preferred_locale' => ['nullable', Rule::in(['fr', 'ar'])],
            'internal_notes' => ['nullable', 'string', 'max:1000'],
            'phones' => ['nullable', 'array'],
            'phones.*.number' => ['required_with:phones', 'string', new E164Phone],
            'phones.*.is_whatsapp' => ['nullable', 'boolean'],
            'phones.*.is_primary' => ['nullable', 'boolean'],
            'emails' => ['nullable', 'array'],
            'emails.*.email' => ['required_with:emails', 'email', 'max:150'],
            'emails.*.is_primary' => ['nullable', 'boolean'],
        ];
    }
}
