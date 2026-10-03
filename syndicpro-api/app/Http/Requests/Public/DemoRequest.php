<?php

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DemoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('locale') === 'ar') {
            app()->setLocale('ar');
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150'],
            'phone' => ['required', 'string', 'max:30'],
            'organization' => ['nullable', 'string', 'max:150'],
            'role' => ['required', Rule::in([
                'syndic_pro', 'syndic_benevole', 'association', 'promoteur', 'autre',
            ])],
            'residences_count' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'lots_count' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'current_tool' => ['nullable', Rule::in(['excel', 'autre_logiciel', 'papier', 'rien'])],
            'message' => ['nullable', 'string', 'max:2000'],
            'consent' => ['accepted'],
            'locale' => ['nullable', Rule::in(['fr', 'ar'])],
            'form_started_at' => ['nullable', 'integer'],
            'website' => ['nullable', 'string', 'max:0'], // honeypot
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $data = $validator->getData();

            if (! empty($data['form_started_at']) && is_numeric($data['form_started_at'])) {
                $elapsedMs = (int) round(microtime(true) * 1000) - (int) $data['form_started_at'];
                if ($elapsedMs < 3000) {
                    $validator->errors()->add('form_started_at', app()->getLocale() === 'ar'
                        ? 'إرسال سريع جدًا.'
                        : 'Envoi trop rapide.');
                }
            }
        });
    }

    public function messages(): array
    {
        if (app()->getLocale() === 'ar') {
            return [
                'name.required' => 'الاسم مطلوب.',
                'email.required' => 'البريد المهني مطلوب.',
                'email.email' => 'بريد غير صالح.',
                'phone.required' => 'الهاتف مطلوب.',
                'role.required' => 'الصفة مطلوبة.',
                'consent.accepted' => 'يجب قبول استخدام معلوماتك للرد على طلبك.',
                'website.max' => 'طلب غير صالح.',
            ];
        }

        return [
            'name.required' => 'Le nom complet est obligatoire.',
            'email.required' => 'L’email professionnel est obligatoire.',
            'email.email' => 'Adresse email invalide.',
            'phone.required' => 'Le téléphone est obligatoire.',
            'role.required' => 'Votre fonction est obligatoire.',
            'consent.accepted' => 'Vous devez accepter que vos informations soient utilisées pour répondre à votre demande.',
            'website.max' => 'Requête invalide.',
        ];
    }
}
