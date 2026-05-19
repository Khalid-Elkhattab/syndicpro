# SyndicPro

Système de gestion de copropriété pour les syndics marocains.

Digitalise la gestion des résidences : budgets, charges, cotisations, paiements, réclamations.

---

## Prérequis

- PHP 8.3+
- Composer
- MySQL 8+
- Node.js 20+
- Redis

---

## Installation

### Backend (Laravel 13)

```bash
cd syndicpro-api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
```

### Frontend (React 18 + TypeScript)

```bash
cd syndicpro-front
npm install
cp .env .env.local
npm run dev
```

---

## Comptes de démonstration

| Rôle | Username | Mot de passe |
|------|----------|-------------|
| Syndic | `syndic` | `password` |
| Copropriétaire | `fatima.b` | `password` |

---

## Déploiement

### Backend

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

Configurer Supervisor pour les workers de queue (voir `deploy/supervisor/syndicpro.conf`).

Ajouter au crontab :

```cron
* * * * * www-data php /var/www/syndicpro-api/artisan schedule:run >> /dev/null 2>&1
```

### Frontend

```bash
cd syndicpro-front
npm run build
```

Servir le dossier `dist/` via Nginx (voir `deploy/nginx/syndicpro.ma.conf`).

---

## Architecture

```
syndicpro-api/   → Laravel 13 (API RESTful, Sanctum SPA, MySQL/Redis)
syndicpro-front/ → React 18 + Vite + TypeScript
docs/            → Documentation complète du projet
```

---

## Tests

```bash
cd syndicpro-api
vendor/bin/pest
```

---

## Licence

Propriétaire — Tous droits réservés.
