<?php

namespace App\Http\Requests\Syndic;

use App\Enums\OwnershipChangeReason;
use App\Rules\E164Phone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransferLotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policy dans le contrôleur
    }

    public function rules(): array
    {
        return [
            'to_owner_id' => ['required_without:new_owner', 'nullable', 'exists:owners,id'],
            'new_owner' => ['required_without:to_owner_id', 'nullable', 'array'],
            'new_owner.type' => ['nullable', Rule::in(['individual', 'company'])],
            'new_owner.first_name' => ['nullable', 'string', 'max:100'],
            'new_owner.last_name' => ['nullable', 'string', 'max:100'],
            'new_owner.company_name' => ['nullable', 'string', 'max:150'],
            'new_owner.identity_number' => ['nullable', 'string', 'max:30'],
            'new_owner.phones' => ['nullable', 'array'],
            'new_owner.phones.*.number' => ['required_with:new_owner.phones', 'string', new E164Phone],
            'new_owner.phones.*.is_whatsapp' => ['nullable', 'boolean'],
            'new_owner.phones.*.is_primary' => ['nullable', 'boolean'],
            'effective_on' => ['required', 'date'],
            'reason' => ['required', Rule::enum(OwnershipChangeReason::class)],
            'quitus_id' => ['nullable', 'exists:quitus_certificates,id'],
            'override_reason' => ['nullable', 'string', 'max:1000'],
            // Transfert sans quitus : motif obligatoire → dossier juridique auto (mesure légale).
            'no_quitus_motif' => ['nullable', 'string', 'max:1000'],
            'account_request_id' => ['nullable', 'exists:account_requests,id'],
            'contract_document_id' => ['nullable', 'exists:documents,id'],
            'contract_reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $lot = $this->route('lot');
            $lotId = $lot instanceof \App\Models\Lot ? $lot->id : (int) $lot;
            $current = \App\Models\LotOwnership::where('lot_id', $lotId)->whereNull('ended_on')->first();
            $effective = $this->input('effective_on');

            if ($current && $effective && $effective < $current->started_on->toDateString()) {
                $validator->errors()->add('effective_on', 'La date d’effet ne peut précéder le début de propriété actuelle.');
            }
        });
    }
}
