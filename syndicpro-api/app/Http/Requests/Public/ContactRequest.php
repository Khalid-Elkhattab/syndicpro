<?php

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContactRequest extends FormRequest
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
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'message' => ['required', 'string', 'max:2000'],
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

            if (empty($data['email']) && empty($data['phone'])) {
                $key = app()->getLocale() === 'ar' ? 'email ou téléphone requis.' : 'Email ou téléphone requis.';
                $validator->errors()->add('email', $key);
            }

            // Anti-spam temporel : rejet sous ~3 secondes (sans tiers).
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
                'message.required' => 'الرسالة مطلوبة.',
                'consent.accepted' => 'يجب قبول استخدام معلوماتك للرد على طلبك.',
                'website.max' => 'طلب غير صالح.',
            ];
        }

        return [
            'name.required' => 'Le nom est obligatoire.',
            'message.required' => 'Le message est obligatoire.',
            'consent.accepted' => 'Vous devez accepter que vos informations soient utilisées pour répondre à votre demande.',
            'website.max' => 'Requête invalide.',
        ];
    }
}
