<?php

namespace App\Http\Requests\Syndic\Contribution;

use App\Enums\CalculationMode;
use App\Enums\ContributionType;
use App\Enums\LotType;
use App\Models\Residence;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContributionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $residence = Residence::find($this->route('residence'));

        return $residence && $residence->syndic_id === $this->user()?->id;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(ContributionType::class)],
            'name' => ['required', 'string', 'max:150'],
            'fiscal_year_id' => ['nullable', 'integer', 'exists:fiscal_years,id'],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['required', 'date', 'after_or_equal:starts_on'],
            'calculation_mode' => ['required', Rule::enum(CalculationMode::class)],
            'annual_budget' => ['nullable', 'numeric', 'min:0'],
            'applies_to_all_buildings' => ['sometimes', 'boolean'],
            'building_ids' => ['nullable', 'array'],
            'building_ids.*' => ['integer', 'exists:buildings,id'],
            'fixed_rates' => ['nullable', 'array', 'min:1'],
            'fixed_rates.*.lot_type' => ['nullable', Rule::enum(LotType::class)],
            'fixed_rates.*.min_surface' => ['nullable', 'numeric', 'min:0'],
            'fixed_rates.*.max_surface' => ['nullable', 'numeric', 'min:0'],
            'fixed_rates.*.monthly_amount' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $data = $validator->getData();
            $mode = $data['calculation_mode'] ?? null;

            if ($mode === 'tantieme' && ($data['annual_budget'] ?? null) === null) {
                $validator->errors()->add(
                    'annual_budget',
                    'Le budget annuel est obligatoire en mode tantièmes.'
                );
            }
            if (in_array($mode, ['fixed', 'per_surface'], true) && empty($data['fixed_rates'])) {
                $validator->errors()->add(
                    'fixed_rates',
                    'La grille à tranches (au moins une ligne) est obligatoire en mode fixe / surface.'
                );
            }
            foreach ($data['fixed_rates'] ?? [] as $i => $rate) {
                if ($mode === 'fixed' && empty($rate['lot_type'])) {
                    $validator->errors()->add(
                        "fixed_rates.{$i}.lot_type",
                        'Le type de lot est obligatoire en mode fixe.'
                    );
                }
                if ($mode === 'per_surface' && ! empty($rate['lot_type'])) {
                    $validator->errors()->add(
                        "fixed_rates.{$i}.lot_type",
                        'Le type de lot doit rester vide en mode surface (tranches pures).'
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'annual_budget.min' => 'Le budget annuel doit être positif.',
            'fixed_rates.*.monthly_amount.min' => 'Le montant mensuel doit être positif.',
        ];
    }
}
