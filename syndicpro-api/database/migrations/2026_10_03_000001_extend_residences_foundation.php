<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('residences', function (Blueprint $table) {
            if (! Schema::hasColumn('residences', 'code')) {
                $table->string('code', 12)->nullable()->unique()->after('id');
            }
            if (! Schema::hasColumn('residences', 'syndicate_name')) {
                $table->string('syndicate_name')->nullable()->after('nom');
            }
            if (! Schema::hasColumn('residences', 'calculation_mode')) {
                $table->string('calculation_mode')->default('tantieme')->after('syndicate_name');
            }
            if (! Schema::hasColumn('residences', 'arrears_on_sale')) {
                $table->string('arrears_on_sale')->default('seller_pays');
            }
            if (! Schema::hasColumn('residences', 'quitus_validity_days')) {
                $table->unsignedSmallInteger('quitus_validity_days')->default(30);
            }
            if (! Schema::hasColumn('residences', 'total_tantiemes')) {
                $table->decimal('total_tantiemes', 14, 4)->nullable();
            }
            if (! Schema::hasColumn('residences', 'fiscal_start_month')) {
                $table->unsignedTinyInteger('fiscal_start_month')->default(9);
            }
            if (! Schema::hasColumn('residences', 'currency')) {
                $table->string('currency', 3)->default('MAD');
            }
            if (! Schema::hasColumn('residences', 'legal_info')) {
                $table->json('legal_info')->nullable();
            }
            if (! Schema::hasColumn('residences', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
            if (! Schema::hasColumn('residences', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        Schema::table('residences', function (Blueprint $table) {
            $table->dropSoftDeletesIfExists();
            foreach (['code', 'syndicate_name', 'calculation_mode', 'arrears_on_sale', 'quitus_validity_days', 'total_tantiemes', 'fiscal_start_month', 'currency', 'legal_info', 'is_active'] as $col) {
                if (Schema::hasColumn('residences', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
