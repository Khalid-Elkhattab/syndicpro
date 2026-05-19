<?php

namespace App\Http\Requests\Syndic\Immeuble;

use Illuminate\Foundation\Http\FormRequest;

class UpdateImmeubleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom de l\'immeuble est obligatoire.',
            'nom.max' => 'Le nom ne doit pas dépasser 100 caractères.',
        ];
    }
}