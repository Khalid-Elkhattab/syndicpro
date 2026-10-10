<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu d'encaissement {{ $payment->receipt_number }} - SyndicPro</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 40px; }
        .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 26px; font-weight: bold; color: #0d9488; }
        .residence { font-size: 14px; color: #475569; margin-top: 6px; }
        .title { font-size: 20px; font-weight: bold; text-align: center; margin: 20px 0 4px; }
        .number { text-align: center; color: #64748b; margin-bottom: 20px; }
        .cancelled { text-align: center; color: #b91c1c; font-size: 18px; font-weight: bold; border: 2px solid #b91c1c; padding: 8px; margin-bottom: 20px; }
        table.info { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table.info td { padding: 7px 10px; border: 1px solid #e2e8f0; vertical-align: top; }
        table.info td.label { background: #f1f5f9; font-weight: bold; width: 32%; }
        .amount-box { text-align: center; border: 2px solid #0d9488; padding: 14px; margin: 20px 0; }
        .amount-box .value { font-size: 26px; font-weight: bold; color: #0f766e; }
        .sign { width: 100%; margin-top: 36px; }
        .sign td { width: 50%; text-align: center; color: #64748b; padding-top: 40px; }
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
<div class="title">Reçu d'encaissement</div>
<div class="number">N° {{ $payment->receipt_number }} · émis le {{ now()->format('d/m/Y') }}</div>
<table class="info">
    <tr><td class="label">Reçu de</td><td>{{ $payment->owner?->display_name }}</td></tr>
    <tr><td class="label">Date d'encaissement</td><td>{{ $payment->paid_on->format('d/m/Y') }}</td></tr>
    <tr><td class="label">Mode de règlement</td><td>{{ $payment->method->frenchLabel() }}{{ $payment->document_number ? ' — pièce n° ' . $payment->document_number : '' }}</td></tr>
    <tr><td class="label">Encaissé par</td><td>{{ $payment->validator?->name ?? '—' }}</td></tr>
</table>
<div class="amount-box">
    <div>Montant reçu</div>
    <div class="value">{{ number_format($tendered, 2, ',', ' ') }} MAD</div>
</div>
@if($payment->notes)
    <table class="info"><tr><td class="label">Observations</td><td>{{ $payment->notes }}</td></tr></table>
@endif
<table class="sign"><tr><td>Signature du syndic</td><td>Signature du copropriétaire</td></tr></table>
<div class="footer">Vérification : {{ $payment->verification_token }} · Reçu généré par SyndicPro</div>
</body>
</html>
