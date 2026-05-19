<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('depenses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sous_charge_id');
            $table->foreign('sous_charge_id')->references('id')->on('sous_charges')->onDelete('restrict');
            $table->unsignedBigInteger('residence_id');
            $table->foreign('residence_id')->references('id')->on('residences')->onDelete('restrict');
            $table->date('date')->comment('Date de la dépense');
            $table->decimal('montant', 12, 2)->comment('Montant en DH');
            $table->text('description')->comment('Description de la dépense');
            $table->string('justificatif_path', 500)->nullable()->comment('Chemin Spatie Media Library');
            $table->timestamps();

            $table->index('sous_charge_id');
            $table->index('residence_id');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('depenses');
    }
};