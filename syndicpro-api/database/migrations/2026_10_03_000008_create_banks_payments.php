<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Spec §4.1 (banks) + §4.5 — comptes bancaires, paiements cibles, allocations.
 * Les paiements ne sont jamais supprimés : annulation (statut + motif).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('banks')) {
            Schema::create('banks', function (Blueprint $t) {
                $t->id();
                $t->string('name')->unique();
                $t->string('short_code', 20)->nullable();
                $t->boolean('is_active')->default(true);
                $t->timestamps();
            });
        }

        if (! Schema::hasTable('suppliers')) {
            Schema::create('suppliers', function (Blueprint $t) {
                $t->id();
                $t->string('name');
                $t->string('category')->nullable();
                $t->string('phone')->nullable();
                $t->string('email')->nullable();
                $t->string('ice')->nullable();
                $t->text('address')->nullable();
                $t->text('notes')->nullable();
                $t->boolean('is_active')->default(true);
                $t->timestamps();
                $t->softDeletes();
            });
        }

        Schema::create('bank_accounts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->constrained()->cascadeOnDelete();
            $t->foreignId('bank_id')->constrained();
            $t->string('label');
            $t->string('account_number')->nullable();
            $t->decimal('opening_balance', 14, 2)->default(0);
            $t->date('opening_date')->nullable();
            $t->boolean('is_active')->default(true);
            $t->timestamps();
            $t->softDeletes();
        });

        Schema::create('payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->constrained();
            $t->foreignId('owner_id')->constrained();
            $t->foreignId('lot_id')->nullable()->constrained();
            $t->foreignId('bank_account_id')->nullable()->constrained();
            $t->foreignId('bank_id')->nullable()->constrained();
            $t->date('paid_on');
            $t->string('method');
            $t->string('document_number')->nullable();
            $t->decimal('amount', 12, 2);
            $t->string('allocation_mode')->default('auto');
            $t->string('status')->default('validated');
            $t->string('source')->default('back_office');
            $t->string('receipt_number')->nullable()->unique();
            $t->uuid('verification_token')->unique();
            $t->timestamp('receipt_sent_at')->nullable();
            $t->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('validated_at')->nullable();
            $t->text('rejection_reason')->nullable();
            $t->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('cancelled_at')->nullable();
            $t->text('cancellation_reason')->nullable();
            $t->text('notes')->nullable();
            $t->audit();
            $t->timestamps();
            $t->index(['residence_id', 'paid_on']);
            $t->index(['owner_id', 'status']);
        });

        Schema::create('payment_allocations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $t->foreignId('due_id')->constrained();
            $t->decimal('amount', 12, 2);
            $t->timestamps();
            $t->unique(['payment_id', 'due_id']);
            $t->index('due_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_allocations');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('bank_accounts');
    }
};
