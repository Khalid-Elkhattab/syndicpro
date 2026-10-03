<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role instanceof \App\Enums\UserRole ? $this->role->value : $this->role,
            'type' => $this->type instanceof \App\Enums\UserType ? $this->type->value : $this->type,
            'status' => $this->status instanceof \App\Enums\AccountStatus ? $this->status->value : $this->status,
            'username' => $this->username,
            'is_active' => $this->is_active,
            'roles' => $this->relationLoaded('roles') ? $this->roles->pluck('name')->all() : $this->getRoleNames()->all(),
            'permissions' => $this->relationLoaded('permissions') ? $this->permissions->pluck('name')->all() : $this->getAllPermissions()->pluck('name')->all(),
            'created_at' => $this->created_at?->format('d/m/Y'),
        ];
    }
}