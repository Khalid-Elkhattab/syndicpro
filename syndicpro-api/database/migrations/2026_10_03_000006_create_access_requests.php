<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Spec §4.3c — demandes d’accès (propriétaire sans accès) + codes SMS/phone. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('phone_verifications', function (Blueprint $t) {
            $t->id();
            $t->string('phone', 20)->index();
            $t->string('purpose');
            $t->string('code_hash');
            $t->unsignedTinyInteger('attempts')->default(0);
            $t->timestamp('expires_at');
            $t->timestamp('verified_at')->nullable();
            $t->string('ip', 45)->nullable();
            $t->timestamps();
        });

        Schema::create('account_requests', function (Blueprint $t) {
            $t->id();
            $t->string('reference')->unique();
            $t->foreignId('residence_id')->constrained();
            $t->string('building_input');
            $t->string('lot_input');
            $t->foreignId('lot_id')->nullable()->constrained();
            $t->foreignId('matched_owner_id')->nullable()->constrained('owners')->nullOnDelete();
            $t->string('match_result');
            $t->string('full_name');
            $t->string('identity_number')->index();
            $t->string('phone', 20);
            $t->string('email')->nullable();
            $t->string('locale', 2)->default('fr');
            $t->text('message')->nullable();
            $t->timestamp('phone_verified_at')->nullable();
            $t->string('status')->default('submitted');
            $t->text('review_note')->nullable();
            $t->text('rejection_reason')->nullable();
            $t->boolean('contact_confirmed')->default(false);
            $t->boolean('documents_checked')->default(false);
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('reviewed_at')->nullable();
            $t->foreignId('approved_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('activation_channel')->nullable();
            $t->timestamp('activation_sent_at')->nullable();
            $t->string('ip', 45)->nullable();
            $t->string('user_agent')->nullable();
            $t->timestamp('expires_at')->nullable();
            $t->timestamps();
            $t->index(['residence_id', 'status']);
            $t->index(['lot_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_requests');
        Schema::dropIfExists('phone_verifications');
    }
};
