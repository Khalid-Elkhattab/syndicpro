<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compte_charges', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('residence_id');
            $table->foreign('residence_id')->references('id')->on('residences')->onDelete('restrict');
            $table->string('nom', 150)->comment('Ex: Entretien & Réparation, Jardinage');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('residence_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compte_charges');
    }
};