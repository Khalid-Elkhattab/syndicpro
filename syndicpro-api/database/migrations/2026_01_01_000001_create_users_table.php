<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->comment('Nom complet');
            $table->string('email', 150)->unique()->comment('Email (optionnel pour copropriétaire)');
            $table->string('phone', 20)->nullable()->comment('Téléphone');
            $table->enum('role', ['syndic', 'coproprietaire'])->comment('Rôle utilisateur');
            $table->string('username', 50)->unique()->comment('Identifiant de connexion');
            $table->string('password');
            $table->boolean('is_active')->default(true)->comment('1=actif, 0=désactivé');
            $table->rememberToken();
            $table->softDeletes();
            $table->timestamps();

            $table->index('role');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};