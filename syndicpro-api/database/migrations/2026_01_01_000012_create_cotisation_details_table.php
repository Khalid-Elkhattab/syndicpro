<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cotisation_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cotisation_id');
            $table->foreign('cotisation_id')->references('id')->on('cotisations')->onDelete('restrict');
            $table->unsignedBigInteger('appartement_id');
            $table->foreign('appartement_id')->references('id')->on('appartements')->onDelete('restrict');
            $table->unsignedBigInteger('coproprietaire_id');
            $table->foreign('coproprietaire_id')->references('id')->on('users')->onDelete('restrict');
            $table->decimal('montant', 12, 2)->comment('Montant dû par cet appartement');
            $table->enum('statut', ['non_paye', 'partiellement_paye', 'paye'])->default('non_paye')->comment('Calculé automatiquement par PaiementObserver — ne jamais définir manuellement');
            $table->decimal('montant_paye', 12, 2)->default(0)->comment('Somme des paiements reçus — mis à jour par PaiementObserver');
            $table->timestamps();

            $table->unique(['cotisation_id', 'appartement_id'], 'uq_cotisation_detail');
            $table->index('cotisation_id');
            $table->index('appartement_id');
            $table->index('coproprietaire_id');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cotisation_details');
    }
};