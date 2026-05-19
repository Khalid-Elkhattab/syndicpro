<?php

namespace App\Repositories;

use App\Models\Periode;

class PeriodeRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Periode());
    }
}
