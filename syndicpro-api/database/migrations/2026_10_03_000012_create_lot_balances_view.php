<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Spec §6 — source unique de vérité des soldes : Σ dus − Σ allocations validées.
 * `dues.amount_paid/status` restent un cache recalculé par DueSettlementService.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement($this->createView());
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS lot_balances');
    }

    private function createView(): string
    {
        return <<<'SQL'
CREATE VIEW lot_balances AS
SELECT d.lot_id,
       SUM(d.amount) AS total_due,
       COALESCE(SUM(a.paid), 0) AS total_paid,
       SUM(d.amount) - COALESCE(SUM(a.paid), 0) AS remaining
FROM dues d
LEFT JOIN (
    SELECT pa.due_id, SUM(pa.amount) AS paid
    FROM payment_allocations pa
    JOIN payments p ON p.id = pa.payment_id AND p.status = 'validated'
    GROUP BY pa.due_id
) a ON a.due_id = d.id
WHERE d.status != 'cancelled'
GROUP BY d.lot_id
SQL;
    }
};
