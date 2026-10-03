<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Compte unique `users` (staff + logins copropriétaires, un seul guard).
 * newplan.md D2/F0. Pas de FK vers lots/owners ici (tables créées plus tard) :
 * colonnes simples + index, les FK suivront.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('type')->default('staff')->after('role');
            $table->string('status')->default('active')->after('type');
            $table->string('locale', 2)->default('fr')->after('status');
            $table->unsignedBigInteger('lot_id')->nullable()->unique()->after('locale');
            $table->unsignedBigInteger('current_owner_id')->nullable()->after('lot_id');
            $table->string('activation_token_hash')->nullable()->after('remember_token');
            $table->timestamp('activation_expires_at')->nullable()->after('activation_token_hash');
            $table->timestamp('password_set_at')->nullable()->after('activation_expires_at');
            $table->unsignedTinyInteger('failed_attempts')->default(0);
            $table->timestamp('locked_until')->nullable();
            $table->unsignedBigInteger('supervisor_id')->nullable()->after('failed_attempts');
            $table->unsignedBigInteger('created_by_id')->nullable()->after('supervisor_id');
            $table->boolean('can_access_all_residences')->default(false);
            $table->timestamp('last_login_at')->nullable();
            $table->index(['type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['type', 'status']);
            $table->dropUnique(['lot_id']);
            $table->dropColumn([
                'type', 'status', 'locale', 'lot_id', 'current_owner_id',
                'activation_token_hash', 'activation_expires_at', 'password_set_at',
                'failed_attempts', 'locked_until', 'supervisor_id', 'created_by_id',
                'can_access_all_residences', 'last_login_at',
            ]);
        });
    }
};
