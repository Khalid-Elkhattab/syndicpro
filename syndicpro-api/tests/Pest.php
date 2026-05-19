<?php

use App\Models\Residence;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;

uses(Tests\TestCase::class, RefreshDatabase::class)->in('Feature');
uses(Tests\TestCase::class)->in('Unit');

function syndicWith(array $attrs = []): User
{
    return User::factory()->syndic()->create($attrs);
}

function coproprietaireWith(array $attrs = []): User
{
    return User::factory()->coproprietaire()->create($attrs);
}

function residenceFor(User $syndic): Residence
{
    return Residence::factory()->create([
        'syndic_id' => $syndic->id,
    ]);
}
