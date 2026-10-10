<?php

namespace App\Http\Requests\Syndic\Contribution;

use App\Enums\CalculationMode;
use App\Enums\ContributionType;
use App\Enums\LotType;
use App\Models\Contribution;
use App\Models\Residence;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContributionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $contribution = $this->route('contribution');
        $residenceId = $contribution instanceof Contribution
            ? (int) $contribution->residence_id
            : (int) $contribution;

        $residence = Residence::find($residenceId);

        return $residence && $residence->syndic_id === $this->user()?->id;
    }

    public function rules(): array
    {
        return [
            'type' => ['sometimes', Rule::enum(ContributionType::class)],
            'name' => ['sometimes', 'string', 'max:150'],
            'fiscal_year_id' => ['nullable', 'integer', 'exists:fiscal_years,id'],
            'starts_on' => ['sometimes', 'date'],
            'ends_on' => ['sometimes', 'date', 'after_or_equal:starts_on'],
            'calculation_mode' => ['sometimes', Rule::enum(CalculationMode::class)],
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
            /** @var Contribution|null $contribution */
            $contribution = $this->route('contribution');
            if ($contribution instanceof Contribution && ! $contribution->isDraft()) {
                $validator->errors()->add(
                    'contribution',
                    'Seule une cotisation à l’état brouillon peut être modifiée.'
                );
            }

            $data = $validator->getData();
            if (! array_key_exists('fixed_rates', $data) || ! $contribution instanceof Contribution) {
                return;
            }
            $mode = $data['calculation_mode']
                ?? $contribution->calculation_mode->value
                ?? $contribution->calculation_mode;
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
}
