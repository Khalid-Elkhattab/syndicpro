<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cotisations', function (Blueprint $table) {
            $table->index(['residence_id', 'id'], 'idx_cotisations_residence_id_id');
        });

        Schema::table('cotisation_details', function (Blueprint $table) {
            $table->index(['cotisation_id', 'statut', 'montant'], 'idx_cotdet_cotisation_id_statut_montant');
        });

        Schema::table('paiements', function (Blueprint $table) {
            $table->index(['cotisation_detail_id', 'montant'], 'idx_paiements_cotdet_id_montant');
        });
    }

    public function down(): void
    {
        Schema::table('cotisations', function (Blueprint $table) {
            $table->dropIndex('idx_cotisations_residence_id_id');
        });

        Schema::table('cotisation_details', function (Blueprint $table) {
            $table->dropIndex('idx_cotdet_cotisation_id_statut_montant');
        });

        Schema::table('paiements', function (Blueprint $table) {
            $table->dropIndex('idx_paiements_cotdet_id_montant');
        });
    }
};
