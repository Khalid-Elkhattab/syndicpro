<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Spec §4.8 documents + §4.12 approbations/API/WhatsApp/imports + §4.13 site vitrine + settings. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_templates', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->nullable()->constrained()->cascadeOnDelete();
            $t->string('type');
            $t->string('locale', 2)->default('fr');
            $t->string('name');
            $t->longText('body');
            $t->boolean('is_active')->default(true);
            $t->timestamps();
            $t->softDeletes();
        });

        Schema::create('documents', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->nullable()->constrained();
            $t->foreignId('building_id')->nullable()->constrained();
            $t->foreignId('owner_id')->nullable()->constrained();
            $t->foreignId('lot_id')->nullable()->constrained();
            $t->foreignId('fiscal_year_id')->nullable()->constrained();
            $t->date('period_start')->nullable();
            $t->date('period_end')->nullable();
            $t->nullableMorphs('documentable');
            $t->string('type');
            $t->string('source')->default('generated');
            $t->string('status')->default('final');
            $t->unsignedSmallInteger('version')->default(1);
            $t->foreignId('supersedes_id')->nullable()->constrained('documents')->nullOnDelete();
            $t->boolean('is_locked')->default(false);
            $t->string('number')->nullable()->index();
            $t->string('title');
            $t->string('locale', 2)->default('fr');
            $t->string('visibility')->default('staff');
            $t->string('disk')->default('private');
            $t->string('path');
            $t->string('mime')->default('application/pdf');
            $t->unsignedBigInteger('size')->nullable();
            $t->string('checksum', 64)->nullable();
            $t->uuid('verification_token')->nullable()->unique();
            $t->foreignId('template_id')->nullable()->constrained('document_templates')->nullOnDelete();
            $t->json('meta')->nullable();
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('generated_at')->nullable();
            $t->timestamps();
            $t->softDeletes();
            $t->index(['residence_id', 'type', 'status']);
            $t->index(['owner_id', 'type']);
            $t->index(['lot_id', 'type']);
        });

        // FK différées vers documents (sqlite ne supporte pas l’ajout de FK via ALTER).
        if (\Illuminate\Support\Facades\DB::getDriverName() !== 'sqlite') {
            Schema::table('collection_actions', function (Blueprint $t) {
                $t->foreign('document_id')->references('id')->on('documents')->nullOnDelete();
            });
            Schema::table('quitus_certificates', function (Blueprint $t) {
                $t->foreign('document_id')->references('id')->on('documents')->nullOnDelete();
            });
            Schema::table('lot_transfers', function (Blueprint $t) {
                $t->foreign('contract_document_id')->references('id')->on('documents')->nullOnDelete();
            });
            Schema::table('announcements', function (Blueprint $t) {
                $t->foreign('document_id')->references('id')->on('documents')->nullOnDelete();
            });
        }

        Schema::create('document_deliveries', function (Blueprint $t) {
            $t->id();
            $t->foreignId('document_id')->constrained()->cascadeOnDelete();
            $t->foreignId('owner_id')->nullable()->constrained();
            $t->foreignId('lot_id')->nullable()->constrained();
            $t->string('channel');
            $t->string('status')->default('queued');
            $t->foreignId('sent_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('sent_at')->nullable();
            $t->timestamp('opened_at')->nullable();
            $t->string('provider_message_id')->nullable();
            $t->text('error')->nullable();
            $t->timestamps();
            $t->index(['document_id', 'status']);
            $t->index(['owner_id', 'sent_at']);
        });

        Schema::create('approval_requests', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->nullable()->constrained();
            $t->string('action');
            $t->nullableMorphs('subject');
            $t->json('payload')->nullable();
            $t->string('status')->default('pending');
            $t->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $t->unsignedBigInteger('requested_via_api_key_id')->nullable();
            $t->text('reason')->nullable();
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('reviewed_at')->nullable();
            $t->text('review_note')->nullable();
            $t->timestamp('expires_at')->nullable();
            $t->timestamps();
            $t->index(['status', 'residence_id']);
        });

        Schema::create('api_keys', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('prefix', 12)->index();
            $t->string('key_hash');
            $t->json('abilities');
            $t->json('residence_ids')->nullable();
            $t->boolean('requires_approval_for_writes')->default(true);
            $t->timestamp('last_used_at')->nullable();
            $t->timestamp('expires_at')->nullable();
            $t->timestamp('revoked_at')->nullable();
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });
        Schema::table('approval_requests', function (Blueprint $t) {
            $t->foreign('requested_via_api_key_id')->references('id')->on('api_keys')->nullOnDelete();
        });

        Schema::create('api_audit_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('api_key_id')->nullable()->constrained()->nullOnDelete();
            $t->string('channel');
            $t->string('tool')->nullable();
            $t->json('request')->nullable();
            $t->unsignedSmallInteger('response_status')->nullable();
            $t->json('response_summary')->nullable();
            $t->string('ip', 45)->nullable();
            $t->unsignedInteger('duration_ms')->nullable();
            $t->timestamp('created_at')->useCurrent();
            $t->index(['api_key_id', 'created_at']);
        });

        Schema::create('whatsapp_conversations', function (Blueprint $t) {
            $t->id();
            $t->string('phone', 20)->index();
            $t->foreignId('owner_id')->nullable()->constrained()->nullOnDelete();
            $t->string('status')->default('bot');
            $t->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('last_message_at')->nullable();
            $t->timestamps();
        });

        Schema::create('whatsapp_messages', function (Blueprint $t) {
            $t->id();
            $t->foreignId('conversation_id')->constrained('whatsapp_conversations')->cascadeOnDelete();
            $t->string('direction');
            $t->string('wa_message_id')->nullable()->unique();
            $t->text('body')->nullable();
            $t->json('payload')->nullable();
            $t->string('status')->nullable();
            $t->timestamp('sent_at')->nullable();
            $t->timestamps();
        });

        Schema::create('import_batches', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->nullable()->constrained();
            $t->string('type');
            $t->string('file_path');
            $t->string('status')->default('pending');
            $t->unsignedInteger('rows_total')->default(0);
            $t->unsignedInteger('rows_imported')->default(0);
            $t->boolean('dry_run')->default(true);
            $t->json('summary')->nullable();
            $t->json('errors')->nullable();
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });

        Schema::create('site_pages', function (Blueprint $t) {
            $t->id();
            $t->string('slug')->unique();
            $t->json('title');
            $t->json('content');
            $t->json('seo')->nullable();
            $t->boolean('is_published')->default(true);
            $t->unsignedSmallInteger('position')->default(0);
            $t->timestamps();
        });

        Schema::create('site_references', function (Blueprint $t) {
            $t->id();
            $t->json('name');
            $t->json('description')->nullable();
            $t->string('city')->nullable();
            $t->unsignedSmallInteger('position')->default(0);
            $t->boolean('is_published')->default(true);
            $t->timestamps();
        });

        Schema::create('inquiries', function (Blueprint $t) {
            $t->id();
            $t->string('type');
            $t->string('name');
            $t->string('email')->nullable();
            $t->string('phone')->nullable();
            $t->text('message')->nullable();
            $t->json('details')->nullable();
            $t->string('status')->default('new');
            $t->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $t->string('ip', 45)->nullable();
            $t->timestamps();
        });

        Schema::create('settings', function (Blueprint $t) {
            $t->string('key')->primary();
            $t->json('value')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('inquiries');
        Schema::dropIfExists('site_references');
        Schema::dropIfExists('site_pages');
        Schema::dropIfExists('import_batches');
        Schema::dropIfExists('whatsapp_messages');
        Schema::dropIfExists('whatsapp_conversations');
        Schema::dropIfExists('api_audit_logs');
        Schema::dropIfExists('api_keys');
        Schema::dropIfExists('approval_requests');
        Schema::dropIfExists('document_deliveries');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('document_templates');
    }
};
