<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hors_budgets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('residence_id');
            $table->foreign('residence_id')->references('id')->on('residences')->onDelete('restrict');
            $table->date('date');
            $table->decimal('montant', 12, 2);
            $table->text('description')->comment('Nature de l\'incident ou urgence');
            $table->string('justificatif_path', 500)->nullable();
            $table->timestamps();

            $table->index('residence_id');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hors_budgets');
    }
};