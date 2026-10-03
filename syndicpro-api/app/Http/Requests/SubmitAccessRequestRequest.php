<?php

namespace App\Http\Requests;

use App\Models\Residence;
use App\Rules\E164Phone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitAccessRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'residence_id' => ['required', 'exists:residences,id'],
            'building_input' => ['required', 'string', 'max:20'],
            'lot_input' => ['required', 'string', 'max:20'],
            'full_name' => ['required', 'string', 'max:150'],
            'identity_number' => ['required', 'string', 'max:30'],
            'phone' => ['required', 'string', new E164Phone],
            'email' => ['nullable', 'email', 'max:150'],
            'locale' => ['nullable', Rule::in(['fr', 'ar'])],
            'message' => ['nullable', 'string', 'max:1000'],
            'proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'website' => ['nullable', 'string', 'max:0'], // honeypot
        ];
    }

    public function messages(): array
    {
        return ['website.max' => 'Requête invalide.'];
    }
}
