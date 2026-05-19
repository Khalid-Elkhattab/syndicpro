<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appartements', function (Blueprint $table) {
            $table->id();
            $table->string('numero', 20)->comment('Numéro d\'appartement');
            $table->tinyInteger('etage')->default(0)->comment('Étage (0=RDC)');
            $table->unsignedBigInteger('immeuble_id');
            $table->foreign('immeuble_id')->references('id')->on('immeubles')->onDelete('restrict');
            $table->unsignedBigInteger('residence_id');
            $table->foreign('residence_id')->references('id')->on('residences')->onDelete('restrict');
            $table->unsignedBigInteger('coproprietaire_id')->nullable();
            $table->foreign('coproprietaire_id')->references('id')->on('users')->onDelete('restrict');
            $table->decimal('tantieme', 10, 4)->default(0)->comment('Quote-part en tantièmes');
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['numero', 'immeuble_id'], 'uq_appartement_numero_immeuble');
            $table->index('residence_id');
            $table->index('coproprietaire_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appartements');
    }
};