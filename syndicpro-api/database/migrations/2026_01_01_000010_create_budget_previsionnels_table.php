<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budget_previsionnels', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('periode_id');
            $table->foreign('periode_id')->references('id')->on('periodes')->onDelete('restrict');
            $table->unsignedBigInteger('compte_charge_id');
            $table->foreign('compte_charge_id')->references('id')->on('compte_charges')->onDelete('restrict');
            $table->decimal('montant_prevu', 12, 2)->comment('Budget alloué en DH');
            $table->decimal('montant_consomme', 12, 2)->default(0)->comment('Total dépenses réelles (mis à jour par observer)');
            $table->timestamps();

            $table->unique(['periode_id', 'compte_charge_id'], 'uq_budget_periode_compte');
            $table->index('periode_id');
            $table->index('compte_charge_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_previsionnels');
    }
};