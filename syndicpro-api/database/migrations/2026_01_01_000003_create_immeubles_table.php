<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('immeubles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('residence_id');
            $table->foreign('residence_id')->references('id')->on('residences')->onDelete('cascade');
            $table->string('nom', 100)->comment('Nom ou lettre de l\'immeuble (ex: Bâtiment A)');
            $table->timestamps();

            $table->index('residence_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('immeubles');
    }
};