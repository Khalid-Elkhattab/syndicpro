<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Décision annuelle du mode de calcul (votée en AG, actée au PV) :
 * - contributions.surface_rate : snapshot du taux au m² (comme coefficient).
 * - fiscal_years : mode décidé + date + AG de référence (PV).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contributions', function (Blueprint $table) {
            $table->decimal('surface_rate', 18, 8)->nullable()->after('coefficient');
        });

        Schema::table('fiscal_years', function (Blueprint $table) {
            $table->string('calculation_mode')->nullable()->after('status');
            $table->timestamp('calculation_mode_decided_at')->nullable()->after('calculation_mode');
            $table->unsignedBigInteger('assembly_id')->nullable()->after('calculation_mode_decided_at');
        });

        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('fiscal_years', function (Blueprint $table) {
                $table->foreign('assembly_id')->references('id')->on('assemblies')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('fiscal_years', function (Blueprint $table) {
                $table->dropForeign(['assembly_id']);
            });
        }

        Schema::table('fiscal_years', function (Blueprint $table) {
            $table->dropColumn(['calculation_mode', 'calculation_mode_decided_at', 'assembly_id']);
        });

        Schema::table('contributions', function (Blueprint $table) {
            $table->dropColumn('surface_rate');
        });
    }
};
