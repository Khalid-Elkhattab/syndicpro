<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'role',
        'username',
        'password',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'role' => UserRole::class,
            'is_active' => 'boolean',
            'deleted_at' => 'datetime',
        ];
    }

    public function residences(): HasMany
    {
        return $this->hasMany(Residence::class, 'syndic_id');
    }

    public function appartements(): HasMany
    {
        return $this->hasMany(Appartement::class, 'coproprietaire_id');
    }

    public function cotisationDetails(): HasMany
    {
        return $this->hasMany(CotisationDetail::class, 'coproprietaire_id');
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class, 'coproprietaire_id');
    }

    public function reclamations(): HasMany
    {
        return $this->hasMany(Reclamation::class, 'coproprietaire_id');
    }

    public function scopeActif($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSyndic($query)
    {
        return $query->where('role', UserRole::Syndic);
    }

    public function scopeCoproprietaire($query)
    {
        return $query->where('role', UserRole::Coproprietaire);
    }
}