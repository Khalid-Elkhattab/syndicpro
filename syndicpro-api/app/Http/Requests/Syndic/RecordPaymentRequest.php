<?php

namespace App\Http\Requests\Syndic;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policy dans le contrôleur
    }

    public function rules(): array
    {
        $method = $this->input('method');
        $needsDoc = in_array($method, [
            PaymentMethod::Cheque->value,
            PaymentMethod::Effet->value,
        ], true);

        return [
            'residence_id' => ['required', 'integer', 'exists:residences,id'],
            'owner_id' => ['required', 'integer', 'exists:owners,id'],
            'lot_id' => ['nullable', 'integer', 'exists:lots,id'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'paid_on' => ['required', 'date', 'before_or_equal:today'],
            'method' => ['required', Rule::in(array_column(PaymentMethod::cases(), 'value'))],
            'document_number' => [$needsDoc ? 'required' : 'nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'document_number.required' => 'Le numéro de pièce est obligatoire pour un chèque ou un effet.',
            'paid_on.before_or_equal' => 'La date d’encaissement ne peut pas être dans le futur.',
        ];
    }
}
