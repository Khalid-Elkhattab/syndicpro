<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sous_charges', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('compte_charge_id');
            $table->foreign('compte_charge_id')->references('id')->on('compte_charges')->onDelete('restrict');
            $table->unsignedBigInteger('residence_id');
            $table->foreign('residence_id')->references('id')->on('residences')->onDelete('restrict');
            $table->string('nom', 150)->comment('Ex: Entretien électricité, Réparation plomberie');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('compte_charge_id');
            $table->index('residence_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sous_charges');
    }
};