<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Types de documents configurables (système + personnalisés) et
 * enrichissement des dossiers juridiques (motif + nature du cas).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_types', function (Blueprint $t) {
            $t->id();
            $t->string('code', 60)->unique();
            $t->string('label_fr');
            $t->string('label_ar')->nullable();
            $t->boolean('is_system')->default(false);
            $t->boolean('is_active')->default(true);
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
            $t->softDeletes();
        });

        Schema::table('lawyer_cases', function (Blueprint $t) {
            // Nature du dossier : unpaid_dues | no_quitus_transfer | other
            $t->string('case_kind', 40)->default('unpaid_dues')->after('status');
            // Motif : pourquoi ce dossier part au juridique.
            $t->text('motif')->nullable()->after('case_kind');
            $t->foreignId('transfer_id')->nullable()->after('lot_id')->constrained('lot_transfers')->nullOnDelete();
        });

        // La colonne legacy `role` devient : syndic | coproprietaire | assistant | super_admin.
        $this->widenUserRole();
    }

    private function widenUserRole(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE users MODIFY role ENUM('syndic','coproprietaire','assistant','super_admin')"
            );

            return;
        }

        // sqlite : émule enum() par un CHECK -> reconstruction sans contrainte.
        Schema::disableForeignKeyConstraints();
        Schema::create('users_new', function (Blueprint $t) {
            $t->id();
            $t->string('name', 100);
            $t->string('email', 150)->unique();
            $t->string('phone', 20)->nullable();
            $t->string('role', 30);
            $t->string('username', 50)->unique();
            $t->string('password');
            $t->rememberToken();
            $t->softDeletes();
            $t->timestamps();
            $t->string('type')->default('staff');
            $t->string('status')->default('active');
            $t->string('locale', 2)->default('fr');
            $t->unsignedBigInteger('lot_id')->nullable()->unique();
            $t->unsignedBigInteger('current_owner_id')->nullable();
            $t->string('activation_token_hash')->nullable();
            $t->timestamp('activation_expires_at')->nullable();
            $t->timestamp('password_set_at')->nullable();
            $t->unsignedTinyInteger('failed_attempts')->default(0);
            $t->timestamp('locked_until')->nullable();
            $t->unsignedBigInteger('supervisor_id')->nullable();
            $t->unsignedBigInteger('created_by_id')->nullable();
            $t->boolean('can_access_all_residences')->default(false);
            $t->timestamp('last_login_at')->nullable();
            $t->boolean('is_active')->default(true);
            $t->index('role');
            $t->index('is_active');
            $t->index(['type', 'status']);
        });

        $cols = ['id', 'name', 'email', 'phone', 'role', 'username', 'password',
            'remember_token', 'deleted_at', 'created_at', 'updated_at', 'type', 'status',
            'locale', 'lot_id', 'current_owner_id', 'activation_token_hash', 'activation_expires_at',
            'password_set_at', 'failed_attempts', 'locked_until', 'supervisor_id', 'created_by_id',
            'can_access_all_residences', 'last_login_at', 'is_active'];
        $list = implode(',', $cols);
        DB::statement("INSERT INTO users_new ({$list}) SELECT {$list} FROM users");
        Schema::drop('users');
        Schema::rename('users_new', 'users');
        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE users MODIFY role ENUM('syndic','coproprietaire')"
            );
        }
        Schema::table('lawyer_cases', function (Blueprint $t) {
            $t->dropForeign(['transfer_id']);
            $t->dropColumn(['case_kind', 'motif', 'transfer_id']);
        });
        Schema::dropIfExists('document_types');
    }
};
