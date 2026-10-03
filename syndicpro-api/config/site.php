<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Public site configuration (landing page)
    |--------------------------------------------------------------------------
    | Single source of truth for the public landing page. Anything left null
    | is hidden in the UI — never render placeholders or fake data.
    */

    'name' => env('SITE_NAME', env('APP_NAME', 'SyndicPro')),

    'tagline' => env('SITE_TAGLINE'),

    'url' => env('SITE_URL', env('APP_URL')),

    'contact' => [
        'email' => env('SITE_CONTACT_EMAIL'),
        'phone' => env('SITE_CONTACT_PHONE'),
        'whatsapp_number' => env('SITE_WHATSAPP_NUMBER'),
        'address' => env('SITE_ADDRESS'),
        'opening_hours' => env('SITE_OPENING_HOURS'),
    ],

    'legal' => [
        'publisher' => env('SITE_LEGAL_PUBLISHER'),
        'registration' => env('SITE_LEGAL_REGISTRATION'),
        'address' => env('SITE_LEGAL_ADDRESS'),
        'host' => env('SITE_LEGAL_HOST'),
    ],

    'demo_recipients' => array_values(array_filter(
        explode(',', (string) env('SITE_DEMO_RECIPIENTS', ''))
    )),

    'links' => [
        'portal_login' => env('SITE_LINK_PORTAL_LOGIN', '/login'),
        'portal_request_access' => env('SITE_LINK_PORTAL_REQUEST_ACCESS'),
        'portal_forgot_password' => env('SITE_LINK_PORTAL_FORGOT_PASSWORD'),
        'staff_login' => env('SITE_LINK_STAFF_LOGIN', '/login'),
        'document_verify' => env('SITE_LINK_DOCUMENT_VERIFY'),
    ],

    'features' => [
        'whatsapp_assistant' => env('SITE_FEATURE_WHATSAPP_ASSISTANT', false),
        'ai_connectivity' => env('SITE_FEATURE_AI_CONNECTIVITY', false),
        'pricing' => env('SITE_FEATURE_PRICING', false),
        'key_figures' => env('SITE_FEATURE_KEY_FIGURES', false),
    ],

    'plans' => [],
];
