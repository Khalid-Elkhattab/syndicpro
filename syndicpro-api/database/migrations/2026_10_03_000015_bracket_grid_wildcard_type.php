<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Grille unique à tranches : `lot_type` null = toutes les typologies.
 * - fixed : lignes typées par lot (lot_type requis).
 * - per_surface : lignes par tranche de surface uniquement (lot_type null).
 * La colonne contributions.surface_rate (taux × m², abandonné) est retirée.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contributions', function (Blueprint $table) {
            $table->dropColumn('surface_rate');
        });

        Schema::table('contribution_fixed_rates', function (Blueprint $table) {
            $table->string('lot_type')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('contribution_fixed_rates', function (Blueprint $table) {
            $table->string('lot_type')->nullable(false)->change();
        });

        Schema::table('contributions', function (Blueprint $table) {
            $table->decimal('surface_rate', 18, 8)->nullable()->after('coefficient');
        });
    }
};
