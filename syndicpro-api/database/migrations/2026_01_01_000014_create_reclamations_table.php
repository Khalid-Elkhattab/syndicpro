<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reclamations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('coproprietaire_id');
            $table->foreign('coproprietaire_id')->references('id')->on('users')->onDelete('restrict');
            $table->unsignedBigInteger('residence_id');
            $table->foreign('residence_id')->references('id')->on('residences')->onDelete('restrict');
            $table->unsignedBigInteger('appartement_id');
            $table->foreign('appartement_id')->references('id')->on('appartements')->onDelete('restrict');
            $table->string('titre', 200)->comment('Titre court de la réclamation');
            $table->text('description')->comment('Description détaillée');
            $table->enum('statut', ['nouveau', 'en_cours', 'traite', 'rejete'])->default('nouveau');
            $table->enum('priorite', ['normale', 'urgente'])->default('normale');
            $table->text('reponse_syndic')->nullable()->comment('Réponse ou commentaire du syndic');
            $table->timestamp('date_reponse')->nullable()->comment('Date de la dernière réponse syndic');
            $table->timestamps();

            $table->index('coproprietaire_id');
            $table->index('residence_id');
            $table->index('statut');
            $table->index('priorite');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reclamations');
    }
};