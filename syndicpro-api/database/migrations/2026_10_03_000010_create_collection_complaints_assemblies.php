<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Spec §4.9 recouvrement + §4.10 réclamations cibles + §4.11 assemblées/quitus/transferts/annonces. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collection_actions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->constrained();
            $t->foreignId('owner_id')->constrained();
            $t->foreignId('lot_id')->nullable()->constrained();
            $t->string('type');
            $t->string('channel');
            $t->string('status')->default('queued');
            $t->decimal('amount_due', 12, 2);
            $t->date('oldest_due_date')->nullable();
            $t->foreignId('document_id')->nullable();
            $t->foreignId('sent_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('sent_at')->nullable();
            $t->string('provider_message_id')->nullable();
            $t->text('error')->nullable();
            $t->timestamps();
            $t->index(['owner_id', 'type', 'sent_at']);
            $t->index(['residence_id', 'sent_at']);
        });

        Schema::create('lawyer_cases', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->constrained();
            $t->foreignId('owner_id')->constrained();
            $t->foreignId('lot_id')->nullable()->constrained();
            $t->decimal('amount_claimed', 12, 2);
            $t->string('status')->default('to_transmit');
            $t->foreignId('formal_notice_action_id')->nullable()->constrained('collection_actions');
            $t->timestamp('exported_at')->nullable();
            $t->text('notes')->nullable();
            $t->audit();
            $t->timestamps();
            $t->softDeletes();
        });

        Schema::create('complaint_types', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->nullable()->constrained()->cascadeOnDelete();
            $t->json('name');
            $t->unsignedSmallInteger('target_hours')->nullable();
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });

        Schema::create('complaints', function (Blueprint $t) {
            $t->id();
            $t->string('reference')->unique();
            $t->foreignId('residence_id')->constrained();
            $t->foreignId('building_id')->nullable()->constrained();
            $t->foreignId('lot_id')->nullable()->constrained();
            $t->foreignId('owner_id')->nullable()->constrained();
            $t->foreignId('complaint_type_id')->constrained();
            $t->text('description');
            $t->string('status')->default('new');
            $t->string('source')->default('staff');
            $t->string('priority')->default('normal');
            $t->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('opened_at')->useCurrent();
            $t->timestamp('resolved_at')->nullable();
            $t->unsignedInteger('resolution_minutes')->nullable();
            $t->text('client_feedback')->nullable();
            $t->timestamp('feedback_sent_at')->nullable();
            $t->audit();
            $t->timestamps();
            $t->softDeletes();
            $t->index(['residence_id', 'status']);
        });

        Schema::create('complaint_messages', function (Blueprint $t) {
            $t->id();
            $t->foreignId('complaint_id')->constrained()->cascadeOnDelete();
            $t->string('author_type');
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('owner_id')->nullable()->constrained()->nullOnDelete();
            $t->text('body');
            $t->boolean('is_internal')->default(false);
            $t->timestamps();
        });

        Schema::create('assemblies', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->constrained();
            $t->foreignId('fiscal_year_id')->nullable()->constrained();
            $t->string('type')->default('ordinary');
            $t->string('status')->default('draft');
            $t->string('title');
            $t->dateTime('scheduled_at');
            $t->string('location');
            $t->text('agenda')->nullable();
            $t->timestamp('convened_at')->nullable();
            $t->decimal('quorum_tantiemes', 14, 4)->nullable();
            $t->decimal('present_tantiemes', 14, 4)->nullable();
            $t->text('minutes_notes')->nullable();
            $t->audit();
            $t->timestamps();
            $t->softDeletes();
        });

        Schema::create('assembly_resolutions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('assembly_id')->constrained()->cascadeOnDelete();
            $t->unsignedSmallInteger('position');
            $t->string('title');
            $t->text('description')->nullable();
            $t->string('majority_rule')->default('simple');
            $t->string('result')->default('pending');
            $t->decimal('votes_for', 14, 4)->default(0);
            $t->decimal('votes_against', 14, 4)->default(0);
            $t->decimal('votes_abstain', 14, 4)->default(0);
            $t->timestamps();
        });

        Schema::create('assembly_attendances', function (Blueprint $t) {
            $t->id();
            $t->foreignId('assembly_id')->constrained()->cascadeOnDelete();
            $t->foreignId('lot_id')->constrained();
            $t->foreignId('owner_id')->constrained();
            $t->string('attendance')->default('absent');
            $t->foreignId('proxy_owner_id')->nullable()->constrained('owners');
            $t->decimal('tantieme_counted', 14, 4)->default(0);
            $t->boolean('signed')->default(false);
            $t->timestamps();
            $t->unique(['assembly_id', 'lot_id']);
        });

        Schema::create('resolution_votes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('resolution_id')->constrained('assembly_resolutions')->cascadeOnDelete();
            $t->foreignId('lot_id')->constrained();
            $t->string('choice');
            $t->decimal('weight', 14, 4);
            $t->timestamps();
            $t->unique(['resolution_id', 'lot_id']);
        });

        Schema::create('quitus_certificates', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->constrained();
            $t->foreignId('owner_id')->constrained();
            $t->foreignId('lot_id')->nullable()->constrained();
            $t->foreignId('fiscal_year_id')->nullable()->constrained();
            $t->string('purpose')->default('sale');
            $t->string('status')->default('valid');
            $t->string('number')->unique();
            $t->decimal('balance_at_issue', 12, 2)->default(0);
            $t->date('issued_on');
            $t->date('valid_until')->nullable();
            $t->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('document_id')->nullable();
            $t->text('cancel_reason')->nullable();
            $t->timestamps();
            $t->index(['lot_id', 'status']);
        });

        Schema::create('lot_transfers', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->constrained();
            $t->foreignId('lot_id')->constrained();
            $t->foreignId('from_owner_id')->constrained('owners');
            $t->foreignId('to_owner_id')->constrained('owners');
            $t->date('effective_on');
            $t->string('reason');
            $t->foreignId('quitus_id')->nullable()->constrained('quitus_certificates')->nullOnDelete();
            $t->decimal('balance_at_transfer', 12, 2)->default(0);
            $t->boolean('quitus_overridden')->default(false);
            $t->text('override_reason')->nullable();
            $t->foreignId('account_request_id')->nullable();
            $t->foreignId('closed_ownership_id')->nullable()->constrained('lot_ownerships')->nullOnDelete();
            $t->foreignId('opened_ownership_id')->nullable()->constrained('lot_ownerships')->nullOnDelete();
            $t->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('contract_document_id')->nullable();
            $t->string('contract_reference')->nullable();
            $t->date('contract_signed_on')->nullable();
            $t->text('notes')->nullable();
            $t->timestamps();
            $t->index(['lot_id', 'effective_on']);
        });

        Schema::create('announcements', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->constrained();
            $t->foreignId('building_id')->nullable()->constrained();
            $t->string('kind')->default('information');
            $t->foreignId('document_id')->nullable();
            $t->json('title');
            $t->json('body');
            $t->timestamp('published_at')->nullable();
            $t->timestamp('expires_at')->nullable();
            $t->json('notify_channels')->nullable();
            $t->audit();
            $t->timestamps();
            $t->softDeletes();
        });
    }

    public function down(): void
    {
        foreach (['announcements', 'lot_transfers', 'quitus_certificates', 'resolution_votes', 'assembly_attendances', 'assembly_resolutions', 'assemblies', 'complaint_messages', 'complaints', 'complaint_types', 'lawyer_cases', 'collection_actions'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
