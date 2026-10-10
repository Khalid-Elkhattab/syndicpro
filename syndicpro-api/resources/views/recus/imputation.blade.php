<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu d'imputation {{ $payment->allocation_receipt_number }} - SyndicPro</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 40px; }
        .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 26px; font-weight: bold; color: #0d9488; }
        .residence { font-size: 14px; color: #475569; margin-top: 6px; }
        .title { font-size: 20px; font-weight: bold; text-align: center; margin: 20px 0 4px; }
        .number { text-align: center; color: #64748b; margin-bottom: 20px; }
        .cancelled { text-align: center; color: #b91c1c; font-size: 18px; font-weight: bold; border: 2px solid #b91c1c; padding: 8px; margin-bottom: 20px; }
        table.info { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.info td { padding: 7px 10px; border: 1px solid #e2e8f0; vertical-align: top; }
        table.info td.label { background: #f1f5f9; font-weight: bold; width: 32%; }
        table.lines { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.lines th { background: #0d9488; color: #fff; padding: 8px; text-align: left; font-size: 11px; }
        table.lines td { padding: 7px 8px; border: 1px solid #e2e8f0; }
        table.lines td.num { text-align: right; }
        table.totals { width: 60%; margin-left: 40%; border-collapse: collapse; }
        table.totals td { padding: 6px 10px; border: 1px solid #e2e8f0; }
        table.totals td.num { text-align: right; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 10px; }
    </style>
</head>
<body>
<div class="header">
    <div class="logo">SyndicPro</div>
    <div class="residence">{{ $payment->residence?->syndicate_name ?? $payment->residence?->nom }} — {{ $payment->residence?->adresse }}, {{ $payment->residence?->ville }}</div>
</div>
@if($cancelled)
    <div class="cancelled">REÇU ANNULÉ{{ $payment->cancellation_reason ? ' — ' . $payment->cancellation_reason : '' }}</div>
@endif
<div class="title">Reçu d'imputation (paiement)</div>
<div class="number">N° {{ $payment->allocation_receipt_number }} · se rapporte à l'encaissement N° {{ $payment->receipt_number }} du {{ $payment->paid_on->format('d/m/Y') }}</div>
<table class="info">
    <tr><td class="label">Copropriétaire</td><td>{{ $payment->owner?->display_name }}</td></tr>
    <tr><td class="label">Montant reçu</td><td>{{ number_format($tendered, 2, ',', ' ') }} MAD ({{ $payment->method->frenchLabel() }})</td></tr>
</table>
<table class="lines">
    <thead><tr><th>Période</th><th>Lot</th><th style="text-align:right">Dû</th><th style="text-align:right">Imputé</th><th style="text-align:right">Reste</th></tr></thead>
    <tbody>
    @forelse($lines as $l)
        <tr>
            <td>{{ $l['period_start'] }} → {{ $l['period_end'] }}</td>
            <td>{{ $l['lot_number'] ?? '—' }}</td>
            <td class="num">{{ number_format($l['owed'], 2, ',', ' ') }}</td>
            <td class="num">{{ number_format($l['applied'], 2, ',', ' ') }}</td>
            <td class="num">{{ number_format($l['open_after'], 2, ',', ' ') }}</td>
        </tr>
    @empty
        <tr><td colspan="5">Aucune imputation : montant conservé en crédit.</td></tr>
    @endforelse
    </tbody>
</table>
<table class="totals">
    <tr><td>Total imputé</td><td class="num">{{ number_format($applied, 2, ',', ' ') }} MAD</td></tr>
    <tr><td>Crédit (reliquat)</td><td class="num">{{ number_format($credit, 2, ',', ' ') }} MAD</td></tr>
    <tr><td>Reste dû global</td><td class="num">{{ number_format($remaining_after, 2, ',', ' ') }} MAD</td></tr>
</table>
<div class="footer">Vérification : {{ $payment->verification_token }} · Reçu généré par SyndicPro</div>
</body>
</html>
