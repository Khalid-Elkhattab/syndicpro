<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Appartement;
use App\Models\Residence;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CoproprietaireSeeder extends Seeder
{
    public function run(): void
    {
        $residences = Residence::pluck('id')->toArray();

        $coproprietairesByResidence = [
            // Résidence 1 (Maarif) — 6 copropriétaires
            [
                ['name' => 'Fatima Benkirane', 'email' => 'fatima.benkirane@email.ma', 'phone' => '+212 6 23 45 67 89', 'username' => 'fatima.b'],
                ['name' => 'Omar Tazi', 'email' => 'omar.tazi@email.ma', 'phone' => '+212 6 34 56 78 90', 'username' => 'omar.t'],
                ['name' => 'Khalid Alami', 'email' => 'khalid.alami@email.ma', 'phone' => '+212 6 45 67 89 01', 'username' => 'khalid.a'],
                ['name' => 'Nadia Senhaji', 'email' => 'nadia.senhaji@email.ma', 'phone' => '+212 6 56 78 90 12', 'username' => 'nadia.s'],
                ['name' => 'Youssef Fassi', 'email' => 'youssef.fassi@email.ma', 'phone' => '+212 6 67 89 01 23', 'username' => 'youssef.f'],
                ['name' => 'Sara Chraibi', 'email' => 'sara.chraibi@email.ma', 'phone' => '+212 6 78 90 12 34', 'username' => 'sara.c'],
            ],
            // Résidence 2 (Agdal) — 4 copropriétaires
            [
                ['name' => 'Hassan El Fassi', 'email' => 'hassan.elfassi@email.ma', 'phone' => '+212 6 11 22 33 44', 'username' => 'hassan.f'],
                ['name' => 'Amina Benjelloun', 'email' => 'amina.benjelloun@email.ma', 'phone' => '+212 6 22 33 44 55', 'username' => 'amina.b'],
                ['name' => 'Rachid El Khayat', 'email' => 'rachid.elkhayat@email.ma', 'phone' => '+212 6 33 44 55 66', 'username' => 'rachid.k'],
                ['name' => 'Leila Benabdeljalil', 'email' => 'leila.benabdeljalil@email.ma', 'phone' => '+212 6 44 55 66 77', 'username' => 'leila.b'],
            ],
            // Résidence 3 (Hivernage) — 4 copropriétaires
            [
                ['name' => 'Mohamed El Aroussi', 'email' => 'mohamed.elaroussi@email.ma', 'phone' => '+212 6 55 66 77 88', 'username' => 'mohamed.a'],
                ['name' => 'Zineb El Ouafi', 'email' => 'zineb.elouafi@email.ma', 'phone' => '+212 6 66 77 88 99', 'username' => 'zineb.o'],
                ['name' => 'Anas Bennani', 'email' => 'anas.bennani@email.ma', 'phone' => '+212 6 77 88 99 00', 'username' => 'anas.b'],
                ['name' => 'Salma Kabbaj', 'email' => 'salma.kabbaj@email.ma', 'phone' => '+212 6 88 99 00 11', 'username' => 'salma.k'],
            ],
            // Résidence 4 (Palmier) — 4 copropriétaires
            [
                ['name' => 'Driss El Moutaouakil', 'email' => 'driss.elmoutaouakil@email.ma', 'phone' => '+212 6 99 00 11 22', 'username' => 'driss.m'],
                ['name' => 'Nawal Berrada', 'email' => 'nawal.berrada@email.ma', 'phone' => '+212 6 00 11 22 33', 'username' => 'nawal.b'],
                ['name' => 'Mehdi El Idrissi', 'email' => 'mehdi.elidrissi@email.ma', 'phone' => '+212 6 12 34 56 79', 'username' => 'mehdi.i'],
                ['name' => 'Imane Tazi', 'email' => 'imane.tazi@email.ma', 'phone' => '+212 6 23 45 67 80', 'username' => 'imane.t'],
            ],
        ];

        $total = 0;

        foreach ($residences as $resIndex => $residenceId) {
            $users = $coproprietairesByResidence[$resIndex] ?? [];
            $appartements = Appartement::where('residence_id', $residenceId)
                ->whereNull('deleted_at')
                ->get();

            foreach ($users as $i => $data) {
                $user = User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'username' => $data['username'],
                    'password' => Hash::make('password'),
                    'role' => UserRole::Coproprietaire,
                    'is_active' => true,
                ]);

                $user->assignRole('coproprietaire');

                // Assign to an apartment in the same residence
                if ($appartements->isNotEmpty()) {
                    $appartement = $appartements[$i % $appartements->count()] ?? $appartements->first();
                    $appartement->update(['coproprietaire_id' => $user->id]);
                }

                $total++;
            }
        }

        $this->command->info("✓ CoproprietaireSeeder: $total copropriétaires créés et assignés");
    }
}
