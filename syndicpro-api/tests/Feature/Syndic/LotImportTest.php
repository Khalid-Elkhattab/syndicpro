<?php

use App\Models\Building;
use App\Models\Lot;
use Illuminate\Http\UploadedFile;

function lotsCsv(array $rows, string $delimiter = ';'): UploadedFile
{
    $header = 'building;lot_number;type;surface;tantieme;land_title_no;parking;parking_numbers;box;box_numbers;floor;notes';
    if ($delimiter === ',') {
        $header = str_replace(';', ',', $header);
    }
    $lines = [$header];
    foreach ($rows as $r) {
        $cells = [
            $r[0], $r[1], $r[2] ?? '', $r[3] ?? '', $r[4] ?? '', $r[5] ?? '',
            $r[6] ?? '', $r[7] ?? '', $r[8] ?? '', $r[9] ?? '', $r[10] ?? '', $r[11] ?? '',
        ];
        $lines[] = implode($delimiter, $cells);
    }
    $path = tempnam(sys_get_temp_dir(), 'lots') . '.csv';
    file_put_contents($path, implode("\n", $lines));

    return new UploadedFile($path, 'lots.csv', 'text/csv', null, true);
}

it('previews lots import without creating anything', function () {
    $syndic = syndicWith();
    $residence = residenceFor($syndic);

    $file = lotsCsv([
        ['B', 'A12', 'appartement', '85.5', '120', '', 'yes', 'P1|P2', 'no', '', '2', ''],
        ['B', 'M3', 'magasin', '42', '60', '', 'no', '', 'no', '', '0', ''],
        ['A', 'B12', 'bureau', '30', '40', '', 'common', '', 'yes', 'B3', '1', ''],
    ]);

    $response = $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/lots/import/preview",
        ['file' => $file]
    );

    $response->assertStatus(200);
    $data = $response->json('data');
    expect($data['rows_total'])->toBe(3)
        ->and($data['to_create_buildings'])->toBe(2)
        ->and($data['to_create_lots'])->toBe(3)
        ->and($data['errors'])->toBeEmpty();
    expect(Building::count())->toBe(0);
    expect(Lot::count())->toBe(0);
});

it('commits lots of all types with annexes and legacy mirror', function () {
    $syndic = syndicWith();
    $residence = residenceFor($syndic);

    $file = lotsCsv([
        ['B', 'A12', 'appartement', '85.5', '120', 'TF 123', 'yes', 'P1|P2', 'no', '', '2', ''],
        ['B', 'M3', 'magasin', '42', '60', '', 'no', '', 'no', '', '0', ''],
        ['A', 'B12', 'bureau', '30', '40', '', 'common', '', 'yes', 'B3', '1', ''],
        ['A', 'D1', 'duplex', '150', '200', '', 'no', '', 'no', '', '3', ''],
    ]);

    $response = $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/lots/import/commit",
        ['file' => $file]
    );

    $response->assertStatus(201);
    expect($response->json('data.created_buildings'))->toBe(2)
        ->and($response->json('data.created_lots'))->toBe(4);

    expect(Lot::where('residence_id', $residence->id)->count())->toBe(4);
    expect(Lot::where('type', 'shop')->count())->toBe(1);
    expect(Lot::where('type', 'office')->count())->toBe(1);
    // Miroir legacy : les écrans actuels continuent de fonctionner.
    expect(\App\Models\Immeuble::where('residence_id', $residence->id)->count())->toBe(2);
    expect(\App\Models\Appartement::where('residence_id', $residence->id)->count())->toBe(4);

    $lot = Lot::with('annexes')->where('number', 'A12')->first();
    expect($lot->annexes)->toHaveCount(2);
    expect($lot->type->value)->toBe('apartment');
    expect($lot->type_label)->toBe('Appartement');
});

it('reimport updates instead of duplicating and rejects invalid file atomically', function () {
    $syndic = syndicWith();
    $residence = residenceFor($syndic);

    $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/lots/import/commit",
        ['file' => lotsCsv([['B', 'A12', 'appartement', '85', '100', '', 'no', '', 'no', '', '2', '']])]
    )->assertStatus(201);

    // Re-import corrigé : update, pas de doublon.
    $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/lots/import/commit",
        ['file' => lotsCsv([['B', 'A12', 'appartement', '90', '110', '', 'no', '', 'no', '', '2', '']])]
    )->assertStatus(201);
    expect(Lot::count())->toBe(1);
    expect((float) Lot::first()->surface)->toBe(90.0);

    // Fichier invalide : rien n'est enregistré.
    $bad = $this->actingAs($syndic)->postJson(
        "/api/syndic/residences/{$residence->id}/lots/import/commit",
        ['file' => lotsCsv([
            ['B', 'A13', 'appartement', '-5', '100', '', 'no', '', 'no', '', '2', ''],
            ['B', 'A13', 'appartement', '50', '100', '', 'no', '', 'no', '', '2', ''],
        ])]
    );
    $bad->assertStatus(422);
    expect(Lot::count())->toBe(1);
});
