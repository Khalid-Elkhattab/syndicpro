<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reçu de paiement - SyndicPro</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
            padding: 40px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #6366f1;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #6366f1;
            margin-bottom: 5px;
        }
        .logo span {
            color: #f59e0b;
        }
        .residence-name {
            font-size: 16px;
            color: #475569;
            margin-top: 10px;
        }
        .receipt-title {
            font-size: 20px;
            font-weight: bold;
            color: #0f172a;
            margin: 25px 0;
            text-align: center;
        }
        .receipt-number {
            font-size: 14px;
            color: #64748b;
            text-align: center;
            margin-bottom: 25px;
        }
        .info-section {
            margin-bottom: 20px;
        }
        .info-section h3 {
            font-size: 14px;
            font-weight: bold;
            color: #6366f1;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e2e8f0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: 600;
            color: #475569;
            width: 140px;
        }
        .info-value {
            color: #0f172a;
            text-align: right;
            flex: 1;
        }
        .amount-section {
            background-color: #f8fafc;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .amount-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .amount-label {
            font-weight: 600;
            color: #475569;
        }
        .amount-value {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
        }
        .amount-total {
            font-size: 18px;
            color: #16a34a;
        }
        .mode-paiement {
            display: inline-block;
            background-color: #e0e7ff;
            color: #4338ca;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }
        .reference {
            font-family: 'Courier New', monospace;
            color: #64748b;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #94a3b8;
            font-size: 10px;
        }
        .footer-text {
            color: #6366f1;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Syndic<span>Pro</span></div>
        @if(isset($cotisation) && $cotisation->residence ?? null)
            <div class="residence-name">{{ $cotisation->residence->nom }}</div>
        @endif
    </div>

    <div class="receipt-title">REÇU DE PAIEMENT</div>
    <div class="receipt-number">Reçu N° {{ $paiement->id }} du {{ $paiement->date_paiement->format('d/m/Y') }}</div>

    <div class="info-section">
        <h3>Informations du copropriétaire</h3>
        <div class="info-row">
            <span class="info-label">Nom :</span>
            <span class="info-value">{{ $coproprietaire->name ?? 'N/A' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Email :</span>
            <span class="info-value">{{ $coproprietaire->email ?? 'N/A' }}</span>
        </div>
    </div>

    <div class="info-section">
        <h3>Informations de l'appartement</h3>
        <div class="info-row">
            <span class="info-label">Appartement :</span>
            <span class="info-value">
                @if($appartement)
                    N° {{ $appartement->numero }}
                    @if($immeuble ?? null)
                        - {{ $imieme->nom }}
                    @endif
                @else
                    N/A
                @endif
            </span>
        </div>
        <div class="info-row">
            <span class="info-label">Étage :</span>
            <span class="info-value">
                @if($appartement)
                    {{ $appartement->etage == 0 ? 'RDC' : $appartement->etage . 'ème étage' }}
                @else
                    N/A
                @endif
            </span>
        </div>
    </div>

    <div class="info-section">
        <h3>Détails du paiement</h3>
        <div class="info-row">
            <span class="info-label">Cotisation :</span>
            <span class="info-value">{{ $cotisation->label ?? 'N/A' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Mode de paiement :</span>
            <span class="info-value">
                <span class="mode-paiement">
                    @switch($paiement->mode_paiement)
                        @case('especes') Espèces @break
                        @case('virement') Virement @break
                        @case('cheque') Chèque @break
                        @case('carte') Carte bancaire @break
                        @default {{ $paiement->mode_paiement }}
                    @endswitch
                </span>
            </span>
        </div>
        @if($paiement->reference)
        <div class="info-row">
            <span class="info-label">Référence :</span>
            <span class="info-value reference">{{ $paiement->reference }}</span>
        </div>
        @endif
    </div>

    <div class="amount-section">
        <div class="amount-row">
            <span class="amount-label">Montant payé :</span>
            <span class="amount-value amount-total">{{ number_format($paiement->montant, 2, ',', ' ') }} DH</span>
        </div>
        @if(isset($montantRestant))
        <div class="amount-row">
            <span class="amount-label">Restant après paiement :</span>
            <span class="amount-value">{{ number_format($montantRestant, 2, ',', ' ') }} DH</span>
        </div>
        @endif
    </div>

    <div class="footer">
        <p>Ce reçu a été généré automatiquement par <span class="footer-text">SyndicPro</span>.</p>
        <p>Date de génération : {{ now()->format('d/m/Y à H:i') }}</p>
    </div>
</body>
</html>