<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('residence_user')) {
            Schema::create('residence_user', function (Blueprint $table) {
                $table->id();
                $table->foreignId('residence_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->unique(['residence_id', 'user_id']);
            });
        }

        if (! Schema::hasTable('fiscal_years')) {
            Schema::create('fiscal_years', function (Blueprint $table) {
                $table->id();
                $table->foreignId('residence_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->date('starts_on');
                $table->date('ends_on');
                $table->string('status')->default('open');
                $table->timestamps();
                $table->softDeletes();
                $table->unique(['residence_id', 'starts_on']);
            });
        }

        if (! Schema::hasTable('number_sequences')) {
            Schema::create('number_sequences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('residence_id')->nullable()->constrained()->cascadeOnDelete();
                $table->string('type');
                $table->unsignedSmallInteger('year');
                $table->unsignedInteger('last_number')->default(0);
                $table->unique(['residence_id', 'type', 'year']);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('buildings')) {
            Schema::create('buildings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('residence_id')->constrained()->cascadeOnDelete();
                $table->string('number');
                $table->string('label')->nullable();
                $table->unsignedSmallInteger('floors')->nullable();
                $table->timestamps();
                $table->softDeletes();
                $table->unique(['residence_id', 'number']);
            });
        }

        if (! Schema::hasTable('lots')) {
            Schema::create('lots', function (Blueprint $table) {
                $table->id();
                $table->foreignId('residence_id')->constrained()->cascadeOnDelete();
                $table->foreignId('building_id')->constrained('buildings');
                $table->string('number');
                // Tous les types de lots, pas seulement appartements (LotType).
                $table->string('type')->default('apartment');
                $table->decimal('surface', 10, 2)->nullable();
                $table->decimal('tantieme', 14, 4)->default(0);
                $table->string('land_title_no')->nullable()->index();
                $table->string('parking_status')->default('no');
                $table->boolean('has_box')->default(false);
                $table->unsignedSmallInteger('floor')->nullable();
                $table->text('notes')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamp('archived_at')->nullable();
                $table->audit();
                $table->timestamps();
                $table->softDeletes();
                $table->unique(['building_id', 'number']);
                $table->index(['residence_id', 'type']);
            });
        }

        if (! Schema::hasTable('lot_annexes')) {
            Schema::create('lot_annexes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('lot_id')->constrained('lots')->cascadeOnDelete();
                $table->string('type');
                $table->string('number');
                $table->timestamps();
                $table->unique(['lot_id', 'type', 'number']);
            });
        }
    }

    public function down(): void
    {
        foreach (['lot_annexes', 'lots', 'buildings', 'number_sequences', 'fiscal_years', 'residence_user'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
