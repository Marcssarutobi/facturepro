<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OrganizationController extends Controller
{
    // GET /api/organizations
    public function index(): JsonResponse
    {
        $organizations = Organization::withCount(['users', 'invoices'])->get();

        return response()->json([
            'success' => true,
            'data'    => $organizations,
        ]);
    }

    // POST /api/organizations
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|unique:organizations,email',
            'phone'   => 'nullable|string|max:20',
            'plan'    => 'required|in:free,pro,business',
            'adresse' => 'required|string',
            'logo'    => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', 'public');
            $validated['logo'] = url(Storage::url($path));
        }

        // Appliquer les limites du plan choisi
        $limits = Organization::PLAN_LIMITS[$validated['plan']];
        $validated['max_users']       = $limits['max_users'];
        $validated['max_invoices']    = $limits['max_invoices'];
        $validated['plan_started_at'] = now();
        $validated['is_active']       = true;

        return DB::transaction(function () use ($validated) {

            // 1. Créer l'organisation
            $organization = Organization::create($validated);

            // 2. Générer un mot de passe aléatoire
            //$plainPassword = Str::random(12);
            $plainPassword = 'Admin@123'; // pour les tests, à changer en prod

            // 3. Créer l'utilisateur admin par défaut
            $user = User::create([
                'fullname'         => 'Admin Admin',
                'email'            => $validated['email'],
                'password'         => Hash::make($plainPassword),
                'organization_id'  => $organization->id,
                'role'             => 'admin',
                'status'           => 'actif',
                'invited_by'       => null,
            ]);

            // TODO: envoyer le mot de passe par email à l'admin

            return response()->json([
                'success'  => true,
                'message'  => 'Organisation créée avec succès',
                'data'     => [
                    'organization' => $organization,
                    'admin'        => [
                        'id'       => $user->id,
                        'fullname' => $user->fullname,
                        'email'    => $user->email,
                        'role'     => $user->role,
                        'password' => $plainPassword, // à envoyer par email en prod
                    ],
                ],
            ], 201);
        });
    }

    // GET /api/organizations/{id}
    public function show(Organization $organization): JsonResponse
    {
        $organization->load(['users', 'customers']);
        $organization->loadCount(['users', 'invoices']);

        return response()->json([
            'success' => true,
            'data'    => array_merge($organization->toArray(), [
                'is_expired'       => $organization->isExpired(),
                'can_add_user'     => $organization->canAddUser(),
                'can_create_invoice' => $organization->canCreateInvoice(),
            ]),
        ]);
    }

    // PUT /api/organizations/{id}
    public function update(Request $request, Organization $organization): JsonResponse
    {
        $validated = $request->validate([
            'name'    => 'sometimes|string|max:255',
            'email'   => 'sometimes|email|unique:organizations,email,' . $organization->id,
            'phone'   => 'nullable|string|max:20',
            'plan'    => 'sometimes|in:free,pro,business',
            'adresse' => 'sometimes|string',
            'logo'    => 'nullable|image|max:2048',
            'plan_expires_at' => 'nullable|date',
            'is_active'       => 'sometimes|boolean',
        ]);

        // Gérer le logo
        if ($request->hasFile('logo')) {
            if ($organization->logo) {
                $oldPath = str_replace('/storage/', 'public/', parse_url($organization->logo, PHP_URL_PATH));
                Storage::delete($oldPath);
            }
            $path = $request->file('logo')->store('logos', 'public');
            $validated['logo'] = url(Storage::url($path));
        }

        $organization->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Organisation mise à jour',
            'data'    => $organization,
        ]);
    }

    // DELETE /api/organizations/{id}
    public function destroy(Organization $organization): JsonResponse
    {
        // Supprimer le logo du storage si existe
        if ($organization->logo) {
            $oldPath = str_replace('/storage/', 'public/', parse_url($organization->logo, PHP_URL_PATH));
            Storage::delete($oldPath);
        }

        $organization->delete();

        return response()->json([
            'success' => true,
            'message' => 'Organisation supprimée',
        ]);
    }
}
