<?php

namespace App\Http\Controllers\Syndic;

use App\Enums\AccountStatus;
use App\Enums\UserRole;
use App\Enums\UserType;
use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\User;
use App\Policies\StaffPolicy;
use App\Support\SpecPermissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

/**
 * Comptes assistants : création par le syndic + matrice de privilèges.
 * Un assistant ne reçoit que des permissions existantes (et détenues par le créateur,
 * sauf super_admin). Les résidences suivent la même règle de périmètre.
 */
class StaffController extends Controller
{
    public function __construct(private StaffPolicy $staffPolicy) {}

    private function ensure(User $actor, string $ability, ?User $target = null): void
    {
        $allowed = match ($ability) {
            'viewAny', 'create' => $this->staffPolicy->{$ability}($actor),
            default => $target ? $this->staffPolicy->{$ability}($actor, $target) : false,
        };
        abort_if(! $allowed, 403, 'Gestion du staff réservée au syndic.');
    }

    /** Catalogue des privilèges attribuables, groupés par module. */
    public function permissions(): JsonResponse
    {
        $grouped = [];
        foreach (SpecPermissions::all() as $name) {
            [$module, $action] = explode('.', $name, 2) + [null, null];
            $grouped[$module][] = ['name' => $name, 'action' => $action];
        }
        ksort($grouped);

        return ApiResponse::success($grouped);
    }

    public function index(Request $request): JsonResponse
    {
        $this->ensure($request->user(), 'viewAny');

        $query = User::where('type', UserType::Staff->value)
            ->with(['roles:id,name', 'permissions:id,name'])
            ->when(! $this->isSuperAdmin($request->user()), function ($q) use ($request) {
                $ids = $request->user()->assignedResidenceIds();
                $q->where(function ($qq) use ($ids) {
                    $qq->whereIn('id', DB::table('residence_user')->whereIn('residence_id', $ids)->pluck('user_id'))
                        ->orWhere('supervisor_id', $request->user()->id);
                });
            })
            ->latest();

        $perPage = min((int) $request->input('per_page', 20), 100);
        $result = $query->paginate($perPage);

        $items = collect($result->items())->map(fn ($u) => $this->present($u));

        return response()->json([
            'success' => true,
            'data' => $items,
            'message' => 'Succès.',
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensure($request->user(), 'create');
        $creator = $request->user();

        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users,email',
            'username' => 'required|string|max:50|unique:users,username|regex:/^[a-zA-Z0-9._]+$/',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'role' => ['required', Rule::in($this->creatableRoles($creator))],
            'residences' => 'nullable|array',
            'residences.*' => 'integer|exists:residences,id',
            'permissions' => 'nullable|array',
            'permissions.*' => ['string', Rule::in(SpecPermissions::all())],
        ], [
            'role.in' => 'Rôle non autorisé pour votre niveau.',
        ]);

        $this->assertScope($creator, $data['residences'] ?? [], $data['permissions'] ?? []);

        $staff = DB::transaction(function () use ($data, $creator) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'username' => $data['username'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
                'type' => UserType::Staff->value,
                'role' => $data['role'],
                'status' => AccountStatus::Active->value,
                'is_active' => true,
                'locale' => 'fr',
                'supervisor_id' => $creator->role === 'assistant' ? null : $creator->id,
                'created_by_id' => $creator->id,
                'password_set_at' => now(),
            ]);

            Role::findOrCreate($data['role'], 'web');
            $user->assignRole($data['role']);
            $user->syncPermissions($data['permissions'] ?? []);

            $residences = $data['residences'] ?? [];
            foreach ($residences as $residenceId) {
                DB::table('residence_user')->updateOrInsert(
                    ['residence_id' => $residenceId, 'user_id' => $user->id],
                    []
                );
            }

            return $user;
        });

        return ApiResponse::success(
            $this->present($staff->load(['roles', 'permissions'])),
            'Compte assistant créé.',
            201
        );
    }

    public function update(Request $request, User $staff): JsonResponse
    {
        $this->ensure($request->user(), 'update', $staff);

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
            'residences' => 'nullable|array',
            'residences.*' => 'integer|exists:residences,id',
            'permissions' => 'nullable|array',
            'permissions.*' => ['string', Rule::in(SpecPermissions::all())],
        ]);

        $this->assertScope($request->user(), $data['residences'] ?? null, $data['permissions'] ?? null);

        DB::transaction(function () use ($staff, $data) {
            $staff->update(array_intersect_key($data, array_flip(['name', 'phone', 'is_active'])));
            if (array_key_exists('permissions', $data)) {
                $staff->syncPermissions($data['permissions'] ?? []);
            }
            if (array_key_exists('residences', $data)) {
                DB::table('residence_user')->where('user_id', $staff->id)->delete();
                foreach ($data['residences'] ?? [] as $residenceId) {
                    DB::table('residence_user')->insert([
                        'residence_id' => $residenceId, 'user_id' => $staff->id,
                    ]);
                }
            }
        });

        return ApiResponse::success(
            $this->present($staff->fresh()->load(['roles', 'permissions'])),
            'Privilèges mis à jour.'
        );
    }

    public function toggleActif(Request $request, User $staff): JsonResponse
    {
        $this->ensure($request->user(), 'update', $staff);
        $staff->update(['is_active' => ! $staff->is_active]);

        return ApiResponse::success(
            $this->present($staff->fresh()->load(['roles', 'permissions'])),
            $staff->is_active ? 'Compte réactivé.' : 'Compte désactivé.'
        );
    }

    public function destroy(Request $request, User $staff): JsonResponse
    {
        $this->ensure($request->user(), 'delete', $staff);
        $staff->delete();

        return ApiResponse::success(null, 'Compte assistant supprimé.');
    }

    private function present(User $u): array
    {
        $residences = [];
        try {
            $residences = DB::table('residence_user')
                ->join('residences', 'residences.id', '=', 'residence_user.residence_id')
                ->where('residence_user.user_id', $u->id)
                ->pluck('residences.nom', 'residences.id')->all();
        } catch (\Throwable) {
        }

        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'username' => $u->username,
            'phone' => $u->phone,
            'role' => $u->role instanceof UserRole ? $u->role->value : $u->role,
            'is_active' => (bool) $u->is_active,
            'status' => $u->status instanceof AccountStatus ? $u->status->value : $u->status,
            'roles' => $u->relationLoaded('roles') ? $u->roles->pluck('name')->all() : [],
            'permissions' => $u->relationLoaded('permissions') ? $u->permissions->pluck('name')->all() : [],
            'residences' => $residences,
            'created_at' => $u->created_at?->format('d/m/Y'),
        ];
    }

    private function isSuperAdmin(User $user): bool
    {
        $role = $user->role instanceof UserRole ? $user->role->value : (string) $user->role;

        return $role === 'super_admin' || (bool) ($user->can_access_all_residences ?? false);
    }

    /** Rôles que le créateur peut attribuer. */
    private function creatableRoles(User $creator): array
    {
        if ($this->isSuperAdmin($creator)) {
            return ['super_admin', 'syndic', 'assistant'];
        }

        return ['assistant'];
    }

    /**
     * Le créateur ne donne que son périmètre : résidences assignées + permissions détenues.
     * (super_admin exempté).
     */
    private function assertScope(User $creator, ?array $residences, ?array $permissions): void
    {
        if ($this->isSuperAdmin($creator)) {
            return;
        }

        if ($residences !== null) {
            $allowed = $creator->assignedResidenceIds();
            $outside = array_diff($residences, $allowed);
            if ($outside !== []) {
                abort(422, 'Résidences hors de votre périmètre : '.implode(', ', $outside));
            }
        }

        if ($permissions !== null) {
            foreach ($permissions as $permission) {
                if (! $creator->can($permission)) {
                    abort(422, "Permission non détenue : {$permission}");
                }
            }
        }
    }
}
