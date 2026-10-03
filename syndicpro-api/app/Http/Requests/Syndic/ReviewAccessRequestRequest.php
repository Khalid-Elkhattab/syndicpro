<?php

namespace App\Http\Requests\Syndic;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewAccessRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policy dans le contrôleur
    }

    public function rules(): array
    {
        return [
            'action' => ['required', Rule::in(['approve', 'needs_info', 'reject'])],
            'review_note' => ['nullable', 'string', 'max:1000'],
            'rejection_reason' => ['required_if:action,reject', 'nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return ['rejection_reason.required_if' => 'Le motif du rejet est obligatoire.'];
    }
}
