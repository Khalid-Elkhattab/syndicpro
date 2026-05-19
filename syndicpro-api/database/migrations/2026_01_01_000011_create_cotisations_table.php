<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cotisations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('residence_id');
            $table->foreign('residence_id')->references('id')->on('residences')->onDelete('restrict');
            $table->unsignedBigInteger('periode_id');
            $table->foreign('periode_id')->references('id')->on('periodes')->onDelete('restrict');
            $table->enum('type', ['fixe', 'exceptionnelle'])->comment('Type de cotisation');
            $table->string('label', 200)->comment('Ex: Charges mensuelles, Réfection ascenseur');
            $table->decimal('montant_total', 12, 2)->comment('Montant total de la cotisation');
            $table->decimal('montant_mensuel', 12, 2)->nullable()->comment('Montant mensuel par appartement (fixe uniquement)');
            $table->enum('mode_repartition', ['egale', 'par_appartement', 'par_tantieme'])->nullable()->comment('Mode répartition (exceptionnelle uniquement)');
            $table->tinyInteger('mois')->nullable()->comment('Mois ciblé (1-12, fixe uniquement)');
            $table->year('annee')->nullable()->comment('Année ciblée (fixe uniquement)');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('residence_id');
            $table->index('periode_id');
            $table->index('type');
            $table->index(['mois', 'annee']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cotisations');
    }
};