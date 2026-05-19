<?php

namespace Database\Seeders;

use App\Models\Residence;
use Illuminate\Database\Seeder;

class ResidenceSeeder extends Seeder
{
    public function run(): void
    {
        $residences = [
            ['nom' => 'Résidence Maarif', 'ville' => 'Casablanca', 'adresse' => 'Rue Maarif, Quartier Maarif'],
            ['nom' => 'Résidence Agdal', 'ville' => 'Rabat', 'adresse' => 'Avenue Mohammed VI, Quartier Agdal'],
            ['nom' => 'Résidence Hivernage', 'ville' => 'Marrakech', 'adresse' => 'Boulevard Zerktouni, Quartier Hivernage'],
            ['nom' => 'Résidence Palmier', 'ville' => 'Tanger', 'adresse' => 'Rue de la Liberté, Quartier Palmier'],
        ];

        foreach ($residences as $r) {
            Residence::create([
                'syndic_id' => 1,
                'nom' => $r['nom'],
                'ville' => $r['ville'],
                'adresse' => $r['adresse'],
            ]);
        }

        $this->command->info('✓ ResidenceSeeder: ' . count($residences) . ' résidences créées');
    }
}