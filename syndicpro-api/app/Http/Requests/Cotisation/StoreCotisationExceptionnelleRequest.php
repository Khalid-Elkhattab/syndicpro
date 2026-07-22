<?php

namespace App\Http\Requests\Cotisation;

use Illuminate\Foundation\Http\FormRequest;

class StoreCotisationExceptionnelleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $residenceId = $this->route('residence');
        $residence = \App\Models\Residence::find($residenceId);

        return $residence && $residence->syndic_id === auth()->id();
    }

    public function rules(): array
    {
        return [
            'label' => 'required|string|max:200',
            'montant_total' => 'required|numeric|min:1',
            'mode_repartition' => 'required|in:egale,par_appartement,par_tantieme',
            'periode_id' => 'required|exists:periodes,id',
            'description' => 'nullable|string|max:500',
            'montants_map' => 'required_if:mode_repartition,par_appartement|array',
            'montants_map.*' => 'numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'label.required' => 'Le label de la cotisation est obligatoire.',
            'label.max' => 'Le label ne doit pas dépasser 200 caractères.',
            'montant_total.required' => 'Le montant total est obligatoire.',
            'montant_total.numeric' => 'Le montant doit être un nombre.',
            'montant_total.min' => 'Le montant doit être au minimum 1 DH.',
            'mode_repartition.required' => 'Le mode de répartition est obligatoire.',
            'mode_repartition.in' => 'Le mode de répartition choisi est invalide.',
            'periode_id.required' => 'La période est obligatoire.',
            'periode_id.exists' => 'La période sélectionnée est invalide.',
            'description.max' => 'La description ne doit pas dépasser 500 caractères.',
            'montants_map.required_if' => 'Les montants par appartement sont obligatoires pour ce mode de répartition.',
            'montants_map.array' => 'Le format des montants est invalide.',
            'montants_map.*.numeric' => 'Chaque montant doit être un nombre.',
            'montants_map.*.min' => 'Chaque montant doit être positif ou nul.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->mode_repartition === 'par_appartement' && !empty($this->montants_map)) {
                $totalMap = array_sum($this->montants_map);
                if (abs($totalMap - $this->montant_total) > 0.01) {
                    $validator->errors()->add(
                        'montants_map',
                        "La somme des montants ({$totalMap} DH) doit être égale au montant total ({$this->montant_total} DH)."
                    );
                }
            }
        });
    }
}