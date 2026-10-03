<?php

namespace App\Models;

use App\Enums\AttendanceType;
use Illuminate\Database\Eloquent\Model;

class AssemblyAttendance extends Model
{
    public $timestamps = true;

    protected $fillable = [
        'assembly_id', 'lot_id', 'owner_id', 'attendance',
        'proxy_owner_id', 'tantieme_counted', 'signed',
    ];

    protected function casts(): array
    {
        return [
            'attendance' => AttendanceType::class,
            'tantieme_counted' => 'decimal:4',
            'signed' => 'boolean',
        ];
    }
}
