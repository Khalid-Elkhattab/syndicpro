<?php

namespace App\Providers;

use App\Models\Depense;
use App\Models\Paiement;
use App\Models\Residence;
use App\Models\Cotisation;
use App\Models\Reclamation;
use App\Models\Immeuble;
use App\Models\Appartement;
use App\Models\User;
use App\Models\Periode;
use App\Observers\DepenseObserver;
use App\Observers\PaiementObserver;
use App\Policies\ResidencePolicy;
use App\Policies\CotisationPolicy;
use App\Policies\ReclamationPolicy;
use App\Policies\BudgetPolicy;
use App\Policies\ImmeublePolicy;
use App\Policies\AppartementPolicy;
use App\Policies\CoproprietairePolicy;
use App\Policies\PeriodePolicy;
use App\Services\CotisationService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Blueprint::macro('audit', function () {
            /** @var Blueprint $this */
            $this->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $this->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
        });

        // Register Observers
        Depense::observe(DepenseObserver::class);
        Paiement::observe(PaiementObserver::class);

        // Register Policies
        Gate::policy(Residence::class, ResidencePolicy::class);
        Gate::policy(Cotisation::class, CotisationPolicy::class);
        Gate::policy(Reclamation::class, ReclamationPolicy::class);
        Gate::policy(\App\Models\BudgetPrevisionnel::class, BudgetPolicy::class);
        Gate::policy(Immeuble::class, ImmeublePolicy::class);
        Gate::policy(Appartement::class, AppartementPolicy::class);
        Gate::policy(User::class, CoproprietairePolicy::class);
        Gate::policy(Periode::class, PeriodePolicy::class);
        Gate::policy(\App\Models\AccountRequest::class, \App\Policies\AccessRequestPolicy::class);
        Gate::policy(\App\Models\Owner::class, \App\Policies\OwnerPolicy::class);

        RateLimiter::for('financial', fn (Request $request) => Limit::perMinute(20));
    }

    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('cotisations:generate-monthly')
            ->monthlyOn(1, '00:00')
            ->withoutOverlapping()
            ->onFailure(fn() => \Illuminate\Support\Facades\Log::error('Génération mensuelle des cotisations échouée'));
    }
}