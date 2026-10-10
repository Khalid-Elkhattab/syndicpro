<?php

namespace App\Http\Requests\Syndic\Residence;

use App\Enums\CalculationMode;
use App\Models\Residence;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FinanceResidenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $residence = Residence::find($this->route('residence'));

        return $residence && $residence->syndic_id === $this->user()?->id;
    }

    public function rules(): array
    {
        return [
            // Défaut résidence.
            'calculation_mode' => ['sometimes', Rule::enum(CalculationMode::class)],
            'arrears_on_sale' => ['sometimes', Rule::in(['seller_pays', 'buyer_pays', 'manual'])],
            'quitus_validity_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            // Décision annuelle votée en AG (actée au PV).
            'fiscal_year_id' => ['nullable', 'integer', 'exists:fiscal_years,id'],
            'year_calculation_mode' => ['nullable', Rule::enum(CalculationMode::class)],
            'assembly_id' => ['nullable', 'integer', 'exists:assemblies,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $data = $validator->getData();
            if (! empty($data['fiscal_year_id']) && empty($data['year_calculation_mode'])) {
                $validator->errors()->add(
                    'year_calculation_mode',
                    'Le mode de calcul de l’exercice est obligatoire.'
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'calculation_mode.enum' => 'Mode de calcul inconnu.',
            'year_calculation_mode.enum' => 'Mode de calcul inconnu.',
            'quitus_validity_days.min' => 'La validité du quitus est d’au moins 1 jour.',
        ];
    }
}
