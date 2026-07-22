<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter([
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://syndicpro.ma',
        'https://www.syndicpro.ma',
        env('FRONTEND_URL'),
    ]),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['Content-Type', 'X-XSRF-TOKEN'],
    'max_age' => env('CORS_MAX_AGE', 86400),
    'supports_credentials' => true,
];