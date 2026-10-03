<?php

namespace App\Http\Requests\Syndic;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IssueSaleQuitusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policy dans le contrôleur
    }

    public function rules(): array
    {
        return [
            'owner_id' => ['required', 'exists:owners,id'],
            'lot_id' => ['required', 'exists:lots,id'],
            'purpose' => ['nullable', Rule::in(['sale', 'fiscal_year', 'other'])],
        ];
    }
}
