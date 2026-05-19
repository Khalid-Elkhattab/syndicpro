<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cotisation_detail_id');
            $table->foreign('cotisation_detail_id')->references('id')->on('cotisation_details')->onDelete('restrict');
            $table->unsignedBigInteger('coproprietaire_id');
            $table->foreign('coproprietaire_id')->references('id')->on('users')->onDelete('restrict');
            $table->date('date_paiement')->comment('Date d\'encaissement');
            $table->decimal('montant', 12, 2)->comment('Montant encaissé');
            $table->enum('mode_paiement', ['especes', 'virement', 'cheque', 'carte'])->default('especes');
            $table->string('reference', 100)->nullable()->comment('Numéro de chèque, référence virement, etc.');
            $table->string('recu_path', 500)->nullable()->comment('Chemin PDF reçu (généré en async)');
            $table->timestamps();

            $table->index('cotisation_detail_id');
            $table->index('coproprietaire_id');
            $table->index('date_paiement');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};