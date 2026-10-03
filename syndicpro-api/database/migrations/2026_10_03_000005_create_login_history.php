<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Spec §4.3b — historique des logins (un par lot) + FK users.lot_id / current_owner_id.
 * `account_events` est APPEND-ONLY (jamais update/delete — garde applicative dans le modèle).
 */
return new class extends Migration
{
    public function up(): void
    {
        $mysql = DB::getDriverName() !== 'sqlite';

        Schema::table('users', function (Blueprint $t) use ($mysql) {
            if ($mysql) {
                $t->foreign('lot_id')->references('id')->on('lots');
                $t->foreign('current_owner_id')->references('id')->on('owners')->nullOnDelete();
                $t->foreign('supervisor_id')->references('id')->on('users')->nullOnDelete();
                $t->foreign('created_by_id')->references('id')->on('users')->nullOnDelete();
            }
        });

        Schema::create('lot_account_assignments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('lot_id')->constrained();
            $t->foreignId('owner_id')->constrained();
            $t->foreignId('lot_ownership_id')->nullable()->constrained();
            $t->timestamp('started_at');
            $t->timestamp('ended_at')->nullable();
            $t->string('end_reason')->nullable();
            $t->foreignId('initialised_by')->nullable()->constrained('users')->nullOnDelete();
            $t->text('notes')->nullable();
            $t->timestamps();
            $t->index(['user_id', 'ended_at']);
            $t->index(['owner_id', 'ended_at']);
        });

        Schema::create('account_events', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained();
            $t->foreignId('owner_id')->nullable()->constrained();
            $t->string('event');
            $t->string('actor_type');
            $t->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('ip', 45)->nullable();
            $t->string('user_agent')->nullable();
            $t->json('meta')->nullable();
            $t->timestamp('created_at')->useCurrent();
            $t->index(['user_id', 'created_at']);
            $t->index(['event', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_events');
        Schema::dropIfExists('lot_account_assignments');

        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('users', function (Blueprint $t) {
                $t->dropForeign(['lot_id']);
                $t->dropForeign(['current_owner_id']);
                $t->dropForeign(['supervisor_id']);
                $t->dropForeign(['created_by_id']);
            });
        }
    }
};
