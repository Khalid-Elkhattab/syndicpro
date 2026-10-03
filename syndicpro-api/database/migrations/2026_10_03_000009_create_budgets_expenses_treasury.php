<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Spec §4.6 budgets/dépenses + §4.7 trésorerie. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budget_accounts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->nullable()->constrained()->cascadeOnDelete();
            $t->foreignId('parent_id')->nullable()->constrained('budget_accounts')->cascadeOnDelete();
            $t->string('code', 20)->nullable();
            $t->json('name');
            $t->boolean('is_active')->default(true);
            $t->timestamps();
            $t->softDeletes();
        });

        Schema::create('budgets', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->constrained()->cascadeOnDelete();
            $t->foreignId('fiscal_year_id')->nullable()->constrained();
            $t->string('type');
            $t->string('kind');
            $t->string('name');
            $t->string('status')->default('draft');
            $t->decimal('total_monthly', 14, 2)->default(0);
            $t->decimal('total_annual', 14, 2)->default(0);
            $t->timestamp('approved_at')->nullable();
            $t->audit();
            $t->timestamps();
            $t->softDeletes();
        });

        Schema::create('budget_lines', function (Blueprint $t) {
            $t->id();
            $t->foreignId('budget_id')->constrained()->cascadeOnDelete();
            $t->foreignId('account_id')->constrained('budget_accounts');
            $t->foreignId('sub_account_id')->nullable()->constrained('budget_accounts');
            $t->string('label')->nullable();
            $t->decimal('quantity', 10, 2)->default(1);
            $t->decimal('unit_price', 12, 2);
            $t->decimal('monthly_amount', 12, 2);
            $t->decimal('annual_amount', 12, 2);
            $t->timestamps();
            $t->index(['budget_id', 'account_id']);
        });

        Schema::create('expenses', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->constrained();
            $t->foreignId('budget_id')->nullable()->constrained();
            $t->foreignId('account_id')->nullable()->constrained('budget_accounts');
            $t->foreignId('sub_account_id')->nullable()->constrained('budget_accounts');
            $t->foreignId('supplier_id')->nullable()->constrained();
            $t->foreignId('bank_account_id')->nullable()->constrained();
            $t->foreignId('bank_id')->nullable()->constrained();
            $t->date('spent_on');
            $t->string('kind')->default('expense');
            $t->string('budget_type')->default('forecast');
            $t->string('budget_kind')->nullable();
            $t->string('description');
            $t->decimal('amount', 12, 2)->default(0);
            $t->string('payment_method')->nullable();
            $t->string('document_number')->nullable();
            $t->string('invoice_number')->nullable();
            $t->string('status')->default('paid');
            $t->text('notes')->nullable();
            $t->audit();
            $t->timestamps();
            $t->softDeletes();
            $t->index(['residence_id', 'spent_on']);
            $t->index(['account_id', 'spent_on']);
            $t->index(['budget_id', 'account_id']);
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE expenses ADD CONSTRAINT chk_expense_kind_amount CHECK (kind <> 'intervention' OR amount = 0)");
        }

        Schema::create('expense_building_splits', function (Blueprint $t) {
            $t->id();
            $t->foreignId('expense_id')->constrained()->cascadeOnDelete();
            $t->foreignId('building_id')->constrained();
            $t->decimal('amount', 12, 2);
            $t->unique(['expense_id', 'building_id']);
        });

        Schema::create('treasury_statements', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->constrained();
            $t->foreignId('bank_account_id')->nullable()->constrained();
            $t->date('period_start');
            $t->date('period_end');
            $t->decimal('opening_balance', 14, 2);
            $t->decimal('total_contributions', 14, 2);
            $t->decimal('total_expenses', 14, 2);
            $t->decimal('computed_closing_balance', 14, 2);
            $t->decimal('bank_closing_balance', 14, 2)->nullable();
            $t->decimal('difference', 14, 2)->nullable();
            $t->string('status')->default('draft');
            $t->text('notes')->nullable();
            $t->audit();
            $t->timestamps();
            $t->softDeletes();
            $t->unique(['residence_id', 'bank_account_id', 'period_start', 'period_end'], 'treasury_period_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('treasury_statements');
        Schema::dropIfExists('expense_building_splits');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('budget_lines');
        Schema::dropIfExists('budgets');
        Schema::dropIfExists('budget_accounts');
    }
};
