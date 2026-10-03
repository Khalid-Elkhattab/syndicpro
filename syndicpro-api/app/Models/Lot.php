<?php

namespace App\Models;

use App\Enums\LotType;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Unité de copropriété : appartement, duplex, magasin, bureau, villa, grande surface, autre.
 * Table unique pour tous les types (newplan.md D4). L'ancien `appartements` reste en lecture seule
 * jusqu'au cutover ; chaque ligne legacy correspond à lots(type=apartment).
 */
class Lot extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'residence_id', 'building_id', 'number', 'type', 'surface', 'tantieme',
        'land_title_no', 'parking_status', 'has_box', 'floor', 'notes',
        'is_active', 'archived_at', 'created_by', 'updated_by',
    ];

    protected $appends = ['type_label', 'display_label'];

    protected function casts(): array
    {
        return [
            'type' => LotType::class,
            'surface' => 'decimal:2',
            'tantieme' => 'decimal:4',
            'has_box' => 'boolean',
            'is_active' => 'boolean',
            'archived_at' => 'datetime',
        ];
    }

    // ---- Relations ----
    public function residence(): BelongsTo
    {
        return $this->belongsTo(Residence::class);
    }

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class, 'building_id');
    }

    public function annexes(): HasMany
    {
        return $this->hasMany(LotAnnex::class, 'lot_id');
    }

    public function ownerships(): HasMany
    {
        return $this->hasMany(LotOwnership::class, 'lot_id');
    }

    public function currentOwnerships(): HasMany
    {
        return $this->hasMany(LotOwnership::class, 'lot_id')->whereNull('ended_on');
    }

    /** Login portail du lot (users.type = owner). Un par lot, jamais supprimé. */
    public function ownerLogin(): HasOne
    {
        return $this->hasOne(User::class, 'lot_id')->where('type', 'owner');
    }

    // ---- Accessors (jamais stockés) ----
    protected function typeLabel(): Attribute
    {
        return Attribute::get(fn () => $this->type instanceof LotType ? $this->type->label() : (string) $this->type);
    }

    protected function displayLabel(): Attribute
    {
        return Attribute::get(function () {
            $type = $this->type_label ?? (string) $this->type;
            $surface = $this->surface ? " ({$this->surface} m²)" : '';
            $building = $this->relationLoaded('building') && $this->building
                ? ' — Bât. '.$this->building->number
                : '';

            return "{$type} {$this->number}{$building}{$surface}";
        });
    }

    // ---- Mutators ----
    protected function number(): Attribute
    {
        return Attribute::set(fn ($v) => is_string($v) ? trim($v) : $v);
    }

    protected function landTitleNo(): Attribute
    {
        return Attribute::set(fn ($v) => $v === null ? null : mb_strtoupper(preg_replace('/\s+/', '', trim((string) $v))));
    }

    protected function type(): Attribute
    {
        return Attribute::set(function ($v) {
            if ($v instanceof LotType) {
                return $v->value;
            }
            $parsed = LotType::fromInput((string) $v);

            return ($parsed ?? LotType::Other)->value;
        });
    }

    // ---- Scopes ----
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByResidence($query, int $residenceId)
    {
        return $query->where('residence_id', $residenceId);
    }

    public function scopeByBuilding($query, int $buildingId)
    {
        return $query->where('building_id', $buildingId);
    }

    public function scopeByType($query, LotType|string $type)
    {
        $value = $type instanceof LotType ? $type->value : (LotType::fromInput($type)?->value ?? $type);

        return $query->where('type', $value);
    }
}
