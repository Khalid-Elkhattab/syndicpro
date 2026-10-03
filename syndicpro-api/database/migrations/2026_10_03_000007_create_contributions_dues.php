<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Spec §4.4 — cotisations cibles + dus mensuels (UNE ligne par lot par mois). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contributions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->constrained()->cascadeOnDelete();
            $t->foreignId('fiscal_year_id')->nullable()->constrained();
            $t->string('type');
            $t->string('name');
            $t->date('starts_on');
            $t->date('ends_on');
            $t->string('calculation_mode');
            $t->decimal('annual_budget', 14, 2)->nullable();
            $t->decimal('coefficient', 18, 8)->nullable();
            $t->decimal('monthly_total', 14, 2)->nullable();
            $t->decimal('annual_total', 14, 2)->nullable();
            $t->boolean('applies_to_all_buildings')->default(true);
            $t->string('status')->default('draft');
            $t->timestamp('published_at')->nullable();
            $t->audit();
            $t->timestamps();
            $t->softDeletes();
            $t->index(['residence_id', 'type', 'starts_on']);
        });

        Schema::create('contribution_buildings', function (Blueprint $t) {
            $t->id();
            $t->foreignId('contribution_id')->constrained()->cascadeOnDelete();
            $t->foreignId('building_id')->constrained()->cascadeOnDelete();
            $t->unique(['contribution_id', 'building_id']);
        });

        Schema::create('contribution_fixed_rates', function (Blueprint $t) {
            $t->id();
            $t->foreignId('contribution_id')->constrained()->cascadeOnDelete();
            $t->string('lot_type');
            $t->decimal('min_surface', 10, 2)->nullable();
            $t->decimal('max_surface', 10, 2)->nullable();
            $t->decimal('monthly_amount', 12, 2);
            $t->timestamps();
        });

        Schema::create('contribution_lots', function (Blueprint $t) {
            $t->id();
            $t->foreignId('contribution_id')->constrained()->cascadeOnDelete();
            $t->foreignId('residence_id')->constrained();
            $t->foreignId('lot_id')->constrained();
            $t->decimal('tantieme_snapshot', 14, 4)->nullable();
            $t->decimal('surface_snapshot', 10, 2)->nullable();
            $t->decimal('annual_amount', 12, 2);
            $t->decimal('monthly_amount', 12, 2);
            $t->timestamps();
            $t->unique(['contribution_id', 'lot_id']);
        });

        Schema::create('dues', function (Blueprint $t) {
            $t->id();
            $t->foreignId('residence_id')->constrained();
            $t->foreignId('contribution_lot_id')->constrained()->cascadeOnDelete();
            $t->foreignId('lot_id')->constrained();
            $t->foreignId('owner_id')->nullable()->constrained();
            $t->date('period_start');
            $t->date('period_end');
            $t->unsignedTinyInteger('days');
            $t->decimal('amount', 12, 2);
            $t->decimal('amount_paid', 12, 2)->default(0);
            $t->date('due_date');
            $t->string('status')->default('unpaid');
            $t->timestamps();
            $t->unique(['contribution_lot_id', 'period_start']);
            $t->index(['residence_id', 'status', 'due_date']);
            $t->index(['lot_id', 'status']);
            $t->index(['owner_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dues');
        Schema::dropIfExists('contribution_lots');
        Schema::dropIfExists('contribution_fixed_rates');
        Schema::dropIfExists('contribution_buildings');
        Schema::dropIfExists('contributions');
    }
};
