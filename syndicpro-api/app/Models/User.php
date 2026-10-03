<?php

namespace App\Models;

use App\Enums\AccountStatus;
use App\Enums\UserRole;
use App\Enums\UserType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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
        'type',
        'status',
        'locale',
        'lot_id',
        'current_owner_id',
        'username',
        'password',
        'is_active',
        'can_access_all_residences',
        'supervisor_id',
        'created_by_id',
        'activation_token_hash',
        'activation_expires_at',
        'password_set_at',
        'failed_attempts',
        'locked_until',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'activation_token_hash',
    ];

    protected function casts(): array
    {
        return [
            'role' => UserRole::class,
            'type' => UserType::class,
            'status' => AccountStatus::class,
            'is_active' => 'boolean',
            'can_access_all_residences' => 'boolean',
            'activation_expires_at' => 'datetime',
            'password_set_at' => 'datetime',
            'locked_until' => 'datetime',
            'last_login_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // Compat : `role` (legacy) <-> `type` (target) toujours synchronisés.
        static::creating(function (User $user) {
            if (empty($user->type) && ! empty($user->role)) {
                $role = $user->role instanceof UserRole ? $user->role : UserRole::tryFrom((string) $user->role);
                $user->type = $role === UserRole::Syndic ? UserType::Staff : UserType::Owner;
            }
            if (empty($user->role) && ! empty($user->type)) {
                $type = $user->type instanceof UserType ? $user->type : UserType::tryFrom((string) $user->type);
                $user->role = $type === UserType::Staff ? UserRole::Syndic : UserRole::Coproprietaire;
            }
            $user->type ??= UserType::Owner->value;
            $user->status ??= AccountStatus::Active->value;
            $user->locale ??= 'fr';
        });
    }

    public function isOwner(): bool
    {
        $type = $this->type instanceof UserType ? $this->type : UserType::tryFrom((string) $this->type);

        return $type === UserType::Owner;
    }

    public function isPendingActivation(): bool
    {
        $status = $this->status instanceof AccountStatus ? $this->status : AccountStatus::tryFrom((string) $this->status);

        return $status === AccountStatus::PendingActivation;
    }

    /** Login copropriétaire → son lot (un par lot). Staff : null. */
    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }

    public function currentOwner(): BelongsTo
    {
        return $this->belongsTo(Owner::class, 'current_owner_id');
    }

    public function accountAssignments(): HasMany
    {
        return $this->hasMany(LotAccountAssignment::class);
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

    /** Résidences accessibles (pivot residence_user si renseigné, sinon syndic_id legacy). */
    public function assignedResidenceIds(): array
    {
        try {
            if (Schema::hasTable('residence_user')) {
                $ids = DB::table('residence_user')
                    ->where('user_id', $this->id)
                    ->pluck('residence_id')->all();
                if (! empty($ids)) {
                    return $ids;
                }
            }
        } catch (\Throwable) {
            // tombe sur le legacy ci-dessous
        }

        return Residence::where('syndic_id', $this->id)->pluck('id')->all();
    }
}
