<?php

namespace App\Services;

use App\Enums\ContributionStatus;
use App\Enums\DueStatus;
use App\Models\Contribution;
use App\Models\ContributionLot;
use App\Models\Due;
use App\Models\Lot;
use App\Models\LotOwnership;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Spec §6 règles 1, 2, 15 : prorata au jour + arrondi au plus fort reste (Σ exacte),
 * snapshot tantième/coefficient, contrôle tantièmes et grille forfaitaire avant publication.
 */
class DueGenerator
{
    /**
     * Découpe un montant annuel en 12 mensualités au prorata des jours (Σ exacte au centime).
     *
     * @return array<int, array{period_start: Carbon, period_end: Carbon, days: int, amount: float}>
     */
    public static function splitAnnual(float $annual, Carbon $startsOn): array
    {
        $months = [];
        $totalDays = 0;
        for ($i = 0; $i < 12; $i++) {
            $start = $startsOn->copy()->addMonthsNoOverflow($i)->startOfMonth();
            $end = $start->copy()->endOfMonth();
            $days = $end->day;
            $months[] = ['period_start' => $start, 'period_end' => $end, 'days' => $days];
            $totalDays += $days;
        }

        $cents = (int) round($annual * 100);
        $raw = [];
        foreach ($months as $i => $m) {
            $exact = $cents * $m['days'] / $totalDays;
            $floored = (int) floor($exact);
            $raw[$i] = ['month' => $m, 'cents' => $floored, 'remainder' => $exact - $floored];
        }

        $distributed = array_sum(array_column($raw, 'cents'));
        $left = $cents - $distributed;
        // Plus fort reste : les centimes restants vont aux mois au plus grand reste.
        usort($raw, fn ($a, $b) => $b['remainder'] <=> $a['remainder']);
        for ($i = 0; $i < $left; $i++) {
            $raw[$i]['cents']++;
        }

        $out = [];
        foreach ($raw as $r) {
            $out[] = [
                'period_start' => $r['month']['period_start'],
                'period_end' => $r['month']['period_end'],
                'days' => $r['month']['days'],
                'amount' => $r['cents'] / 100,
            ];
        }
        usort($out, fn ($a, $b) => $a['period_start'] <=> $b['period_start']);

        return $out;
    }

    /**
     * Publie une contribution : snapshots + dues. Lève en cas de contrôle KO.
     */
    public function publish(Contribution $contribution): Contribution
    {
        return DB::transaction(function () use ($contribution) {
            $residence = $contribution->residence;
            $lots = Lot::byResidence($residence->id)->active()->with('building')->get();

            // Règle 1 : contrôle tantièmes.
            if ($residence->total_tantiemes && (float) $lots->sum('tantieme') !== (float) $residence->total_tantiemes) {
                throw new \LogicException('Total tantièmes ≠ total attendu de la résidence.');
            }

            $annuals = $this->annualsPerLot($contribution, $lots);

            foreach ($annuals as $lotId => $annual) {
                $lot = $lots->firstWhere('id', $lotId);
                $clot = ContributionLot::updateOrCreate(
                    ['contribution_id' => $contribution->id, 'lot_id' => $lotId],
                    [
                        'residence_id' => $residence->id,
                        'tantieme_snapshot' => $lot->tantieme,
                        'surface_snapshot' => $lot->surface,
                        'annual_amount' => $annual,
                        'monthly_amount' => round($annual / 12, 2),
                    ]
                );

                foreach (self::splitAnnual($annual, Carbon::parse($contribution->starts_on)) as $m) {
                    Due::updateOrCreate(
                        ['contribution_lot_id' => $clot->id, 'period_start' => $m['period_start']->toDateString()],
                        [
                            'residence_id' => $residence->id,
                            'lot_id' => $lotId,
                            'owner_id' => $this->billingOwnerId($lotId),
                            'period_end' => $m['period_end']->toDateString(),
                            'days' => $m['days'],
                            'amount' => $m['amount'],
                            'due_date' => $m['period_end']->toDateString(),
                            'status' => DueStatus::Unpaid->value,
                        ]
                    );
                }
            }

            $contribution->update([
                'status' => ContributionStatus::Published->value,
                'published_at' => now(),
            ]);

            return $contribution->fresh();
        });
    }

    /** @return array<int, float> lot_id => montant annuel */
    private function annualsPerLot(Contribution $contribution, $lots): array
    {
        if ($contribution->calculation_mode->value === 'fixed') {
            return $this->fixedAnnuals($contribution, $lots);
        }

        $totalTantiemes = (float) $lots->sum('tantieme');
        if ($totalTantiemes <= 0) {
            throw new \LogicException('Tantièmes totaux nuls : calcul impossible.');
        }
        $coefficient = (float) $contribution->annual_budget / $totalTantiemes;
        $contribution->update(['coefficient' => $coefficient]);

        $out = [];
        foreach ($lots as $lot) {
            $out[$lot->id] = round((float) $lot->tantieme * $coefficient, 2);
        }

        return $out;
    }

    private function fixedAnnuals(Contribution $contribution, $lots): array
    {
        $rates = $contribution->fixedRates()->get();
        $out = [];
        foreach ($lots as $lot) {
            // Règle 15 : chaque lot correspond à EXACTEMENT une ligne de grille.
            $matches = $rates->filter(fn ($r) => $r->lot_type === $lot->type->value
                && ($r->min_surface === null || (float) $lot->surface >= (float) $r->min_surface)
                && ($r->max_surface === null || (float) $lot->surface <= (float) $r->max_surface));
            if ($matches->count() !== 1) {
                throw new \LogicException("Lot {$lot->number} : {$matches->count()} lignes de grille (attendu 1).");
            }
            $out[$lot->id] = round((float) $matches->first()->monthly_amount * 12, 2);
        }

        return $out;
    }

    private function billingOwnerId(int $lotId): ?int
    {
        return LotOwnership::where('lot_id', $lotId)
            ->whereNull('ended_on')
            ->where('is_billing_contact', true)
            ->value('owner_id');
    }
}
