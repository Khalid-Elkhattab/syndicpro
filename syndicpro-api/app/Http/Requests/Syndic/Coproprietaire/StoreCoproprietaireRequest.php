<?php

namespace App\Http\Requests\Syndic\Coproprietaire;

use Illuminate\Foundation\Http\FormRequest;

class StoreCoproprietaireRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'username' => 'required|string|max:50|unique:users,username|regex:/^[a-zA-Z0-9._]+$/',
            'password' => 'required|string|min:8|confirmed',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom est obligatoire.',
            'name.max' => 'Le nom ne doit pas dépasser 100 caractères.',
            'email.required' => 'L\'email est obligatoire.',
            'email.email' => 'L\'adresse email n\'est pas valide.',
            'email.unique' => 'Cet email est déjà utilisé.',
            'phone.max' => 'Le numéro de téléphone ne doit pas dépasser 20 caractères.',
            'username.required' => 'Le nom d\'utilisateur est obligatoire.',
            'username.max' => 'Le nom d\'utilisateur ne doit pas dépasser 50 caractères.',
            'username.unique' => 'Ce nom d\'utilisateur est déjà pris.',
            'username.regex' => 'Le nom d\'utilisateur ne doit contenir que des lettres, chiffres, points et underscores.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
        ];
    }
}