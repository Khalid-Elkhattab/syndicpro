<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            ResidenceSeeder::class,
            ImmeubleSeeder::class,
            AppartementSeeder::class,
            CoproprietaireSeeder::class,
            CompteChargeSeeder::class,
            SousChargeSeeder::class,
            PeriodeSeeder::class,
            BudgetPrevisionnelSeeder::class,
            DepenseSeeder::class,
            HorsBudgetSeeder::class,
            CotisationSeeder::class,
            CotisationDetailSeeder::class,
            PaiementSeeder::class,
            ReclamationSeeder::class,
            DocumentTypeSeeder::class,
        ]);

        $this->command->info('');
        $this->command->info('========================================');
        $this->command->info('✓ Tous les seeders ont été exécutés');
        $this->command->info('========================================');
        $this->command->info('');
        $this->command->info('Comptes de test créés:');
        $this->command->info('  - Syndic: syndic / password');
        $this->command->info('  - Copropriétaires: fatima.b / password (et 5 autres)');
    }
}