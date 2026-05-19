<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('residences', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('syndic_id');
            $table->foreign('syndic_id')->references('id')->on('users')->onDelete('restrict');
            $table->string('nom', 150)->comment('Nom de la résidence');
            $table->string('ville', 100)->comment('Ville');
            $table->text('adresse')->comment('Adresse complète');
            $table->unsignedInteger('nb_immeubles')->default(0)->comment('Nombre d\'immeubles (calculé)');
            $table->timestamps();

            $table->index('syndic_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('residences');
    }
};