<?php

use App\Enums\InquiryType;
use App\Models\Inquiry;
use App\Notifications\NewInquiryNotification;
use Illuminate\Support\Facades\Notification;

function demoPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Salma Bennani',
        'email' => 'salma@gestion.ma',
        'phone' => '+212661234567',
        'organization' => 'Gestion Immobilière SARL',
        'role' => 'syndic_pro',
        'residences_count' => 4,
        'lots_count' => 320,
        'current_tool' => 'excel',
        'message' => 'Nous gérons 4 résidences sur Casablanca.',
        'consent' => true,
        'locale' => 'fr',
        'form_started_at' => (int) round(microtime(true) * 1000) - 15000,
    ], $overrides);
}

function contactPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Yasmine El Fassi',
        'email' => 'yasmine@example.com',
        'message' => 'Quels sont vos horaires ?',
        'consent' => true,
        'locale' => 'fr',
        'form_started_at' => (int) round(microtime(true) * 1000) - 15000,
    ], $overrides);
}

it('stores a valid demo request and queues the team notification', function () {
    config()->set('site.demo_recipients', ['equipe@example.com']);
    Notification::fake();

    $response = $this->postJson('/api/public/demo', demoPayload());

    $response->assertStatus(201)->assertJsonStructure(['message', 'reference']);

    $inquiry = Inquiry::first();
    expect($inquiry->type->value)->toBe('demo')
        ->and($inquiry->status->value)->toBe('new')
        ->and($inquiry->details['organization'])->toBe('Gestion Immobilière SARL')
        ->and($inquiry->details['consent_at'])->not->toBeNull();

    Notification::assertSentTimes(NewInquiryNotification::class, 1);
});

it('stores a valid contact request with phone instead of email', function () {
    Notification::fake();

    $response = $this->postJson('/api/public/contact', contactPayload([
        'email' => null, 'phone' => '+212670000000',
    ]));

    $response->assertStatus(201);
    expect(Inquiry::first()->type->value)->toBe('contact');
});

it('rejects invalid input and keeps the door closed without consent', function () {
    $this->postJson('/api/public/demo', demoPayload(['consent' => false]))
        ->assertStatus(422)->assertJsonValidationErrors(['consent']);

    $this->postJson('/api/public/contact', contactPayload(['email' => null]))
        ->assertStatus(422)->assertJsonValidationErrors(['email']);

    expect(Inquiry::count())->toBe(0);
});

it('rejects honeypot and too-fast submissions', function () {
    $this->postJson('/api/public/demo', demoPayload(['website' => 'bot']))
        ->assertStatus(422);

    $this->postJson('/api/public/contact', contactPayload([
        'form_started_at' => (int) round(microtime(true) * 1000),
    ]))->assertStatus(422)->assertJsonValidationErrors(['form_started_at']);

    expect(Inquiry::count())->toBe(0);
});

it('throttles public form submissions per IP', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/public/contact', contactPayload())->assertStatus(201);
    }

    $this->postJson('/api/public/contact', contactPayload())->assertStatus(429);
    expect(Inquiry::count())->toBe(5);
});

it('keeps the legacy quote type working alongside demo', function () {
    $inquiry = Inquiry::create([
        'type' => 'quote',
        'name' => 'Legacy',
        'status' => 'new',
    ]);

    expect($inquiry->fresh()->type->value)->toBe('quote');
    expect(InquiryType::Demo->label())->toBe('Démo');
});

it('exposes the public site config without leaking secrets', function () {
    $response = $this->getJson('/api/public/site-config')->assertStatus(200);

    $response->assertJsonStructure([
        'name', 'tagline', 'contact', 'links', 'features', 'plans',
    ]);
    expect($response->json('features.whatsapp_assistant'))->toBeFalse();
});

it('serves a sitemap listing both locales', function () {
    $response = $this->get('/sitemap.xml')->assertStatus(200);

    $content = $response->getContent();
    expect($content)
        ->toContain('<loc>'.rtrim(config('app.url'), '/').'/</loc>')
        ->toContain('/ar')
        ->toContain('mentions-legales')
        ->toContain('confidentialite');
});
