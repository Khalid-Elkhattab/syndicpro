<?php

namespace App\Services;

use App\Enums\CotisationDetailStatut;
use App\Events\PaiementRecorded;
use App\Jobs\GenerateReceipt;
use App\Models\CotisationDetail;
use App\Models\Paiement;
use App\Repositories\PaiementRepository;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class PaiementService
{
    public function __construct(
        private PaiementRepository $paiementRepo,
    ) {}

    public function enregistrerPaiement(array $data): Paiement
    {
        $detail = $this->paiementRepo->findDetail($data['cotisation_detail_id']);

        if (!$detail) {
            throw new \InvalidArgumentException('Le détail de cotisation n\'existe pas.');
        }

        $resteAPayer = (float) $detail->montant - (float) $detail->montant_paye;

        if ($data['montant'] > $resteAPayer) {
            throw new \InvalidArgumentException(
                sprintf('Le montant saisi (%.2f DH) dépasse le restant à payer (%.2f DH).', $data['montant'], $resteAPayer)
            );
        }

        if ($detail->statut === CotisationDetailStatut::Paye) {
            throw new \InvalidArgumentException('Cette cotisation est déjà payée intégralement.');
        }

        $paiement = $this->paiementRepo->create([
            'cotisation_detail_id' => $data['cotisation_detail_id'],
            'coproprietaire_id' => $detail->coproprietaire_id,
            'date_paiement' => $data['date_paiement'],
            'montant' => $data['montant'],
            'mode_paiement' => $data['mode_paiement'],
            'reference' => $data['reference'] ?? null,
        ]);

        event(new PaiementRecorded($paiement));

        GenerateReceipt::dispatch($paiement->id)->onQueue('receipts');

        return $paiement->load(['cotisationDetail', 'coproprietaire']);
    }

    public function updateCotisationDetailStatut(int $cotisationDetailId): void
    {
        $detail = $this->paiementRepo->findDetail($cotisationDetailId);

        if (!$detail) {
            return;
        }

        $totalPaye = $this->paiementRepo->sumPaiementsByDetail($cotisationDetailId);

        $nouveauStatut = match (true) {
            $totalPaye >= (float) $detail->montant => CotisationDetailStatut::Paye,
            $totalPaye > 0 => CotisationDetailStatut::PartiellementPaye,
            default => CotisationDetailStatut::NonPaye,
        };

        $this->paiementRepo->updateDetail($cotisationDetailId, [
            'montant_paye' => $totalPaye,
            'statut' => $nouveauStatut->value,
        ]);
    }

    public function genererRecu(int $paiementId): ?string
    {
        $paiement = Paiement::with([
            'cotisationDetail.cotisation',
            'cotisationDetail.appartement.immeuble',
            'coproprietaire',
        ])->find($paiementId);

        if (!$paiement) {
            return null;
        }

        $detail = $paiement->cotisationDetail;
        $appartement = $detail->appartement;
        $immeuble = $appartement?->immeuble;
        $cotisation = $detail->cotisation;

        $montantRestant = (float) $detail->montant - (float) $detail->montant_paye;

        $pdf = Pdf::loadView('recus.recu', [
            'paiement' => $paiement,
            'coproprietaire' => $paiement->coproprietaire,
            'appartement' => $appartement,
            'immeuble' => $immeuble ?? null,
            'cotisation' => $cotisation,
            'montantRestant' => $montantRestant,
        ]);

        $pdf->setPaper('a4', 'portrait');

        $filename = 'recu_' . $paiement->id . '_' . now()->format('YmdHis') . '.pdf';
        $path = 'recus/' . $filename;

        Storage::disk('local')->put($path, $pdf->output());

        $paiement->recu_path = $path;
        $paiement->save();

        return $path;
    }

    public function getPaiementsByResidence(int $residenceId, array $filters = []): \Illuminate\Pagination\LengthAwarePaginator
    {
        return $this->paiementRepo->findByResidence($residenceId, $filters);
    }

    public function getTotalPercu(int $residenceId, ?int $periodeId = null): array
    {
        return $this->paiementRepo->getTotalPercu($residenceId, $periodeId);
    }
}