<?php

namespace App\Http\Requests;

use App\Rules\E164Phone;
use Illuminate\Foundation\Http\FormRequest;

class SendPhoneCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['phone' => ['required', 'string', new E164Phone]];
    }
}
