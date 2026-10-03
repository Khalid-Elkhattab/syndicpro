<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Spec §4.3 — owners, contacts, ownership history, promoteur.
 * `owners` holds personal data; logins stay in `users` (§4.3b).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('owners', function (Blueprint $t) {
            $t->id();
            $t->string('type')->default('individual');
            $t->string('first_name')->nullable();
            $t->string('last_name')->nullable();
            $t->string('company_name')->nullable();
            // CIN (ou RC) : indexé, normalisé (majuscules, sans espaces) à l’enregistrement.
            // Pas de contrainte unique DB (soft deletes + cas sans CIN) : le service lie les doublons.
            $t->string('identity_number')->nullable()->index();
            $t->string('preferred_locale', 2)->default('fr');
            $t->text('internal_notes')->nullable();
            $t->audit();
            $t->timestamps();
            $t->softDeletes();
            $t->index(['last_name', 'first_name']);
            $t->index('company_name');
        });

        Schema::create('owner_phones', function (Blueprint $t) {
            $t->id();
            $t->foreignId('owner_id')->constrained()->cascadeOnDelete();
            $t->string('number', 20);
            $t->boolean('is_whatsapp')->default(false);
            $t->boolean('is_primary')->default(false);
            $t->timestamps();
            $t->index('number');
            $t->unique(['owner_id', 'number']);
        });

        Schema::create('owner_emails', function (Blueprint $t) {
            $t->id();
            $t->foreignId('owner_id')->constrained()->cascadeOnDelete();
            $t->string('email');
            $t->boolean('is_primary')->default(false);
            $t->timestamps();
            $t->unique(['owner_id', 'email']);
        });

        Schema::create('lot_ownerships', function (Blueprint $t) {
            $t->id();
            $t->foreignId('lot_id')->constrained()->cascadeOnDelete();
            $t->foreignId('owner_id')->constrained();
            $t->decimal('share_percent', 5, 2)->default(100);
            $t->boolean('is_billing_contact')->default(true);
            $t->date('started_on');
            $t->date('ended_on')->nullable();
            $t->string('change_reason')->default('initial');
            $t->text('notes')->nullable();
            $t->audit();
            $t->timestamps();
            $t->unique(['lot_id', 'owner_id', 'started_on']);
            $t->index(['owner_id', 'ended_on']);
        });

        Schema::table('residences', function (Blueprint $t) {
            $t->unsignedBigInteger('promoter_owner_id')->nullable()->after('legal_info');
            if (DB::getDriverName() !== 'sqlite') {
                $t->foreign('promoter_owner_id')->references('id')->on('owners')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('residences', function (Blueprint $t) {
            if (DB::getDriverName() !== 'sqlite') {
                $t->dropForeign(['promoter_owner_id']);
            }
            $t->dropColumn('promoter_owner_id');
        });
        Schema::dropIfExists('lot_ownerships');
        Schema::dropIfExists('owner_emails');
        Schema::dropIfExists('owner_phones');
        Schema::dropIfExists('owners');
    }
};
