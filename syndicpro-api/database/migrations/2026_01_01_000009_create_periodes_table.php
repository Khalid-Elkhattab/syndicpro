<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periodes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('residence_id');
            $table->foreign('residence_id')->references('id')->on('residences')->onDelete('restrict');
            $table->year('annee')->comment('Exercice annuel (ex: 2026)');
            $table->boolean('is_active')->default(true)->comment('1=période courante');
            $table->date('date_debut')->comment('Date de début de la période');
            $table->date('date_fin')->comment('Date de fin de la période');
            $table->timestamps();

            $table->unique(['residence_id', 'annee'], 'uq_periode_residence_annee');
            $table->index('residence_id');
            $table->index('annee');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('periodes');
    }
};