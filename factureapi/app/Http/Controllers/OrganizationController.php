<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Organization;
use App\Models\User;
use FedaPay\FedaPay;
use FedaPay\Transaction;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

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
            'months'  => 'nullable|integer|min:1',
            'adresse' => 'required|string',
            'country' => 'required|string',
            'logo'    => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', 'public');
            $validated['logo'] = url(Storage::url($path));
        }

        // ✅ LOGIQUE EXPIRATION
        if ($validated['plan'] === 'free') {
            $validated['plan_expires_at'] = null;
        } else {
            $months = $validated['months'] ?? 1;
            $validated['plan_expires_at'] = now()->addMonths($months);
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
            'emcef' => [
                'ifu'          => $organization->ifu,
                'emcef_nim'    => $organization->emcef_nim,
                'emcef_active' => $organization->emcef_active,
                'has_token'    => !empty($organization->emcef_token), // ne pas exposer le token
                'can_normalize'=> $organization->canNormalize(),
            ],
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
            'country' => 'nullable|string|max:255',
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

    public function changePlan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transaction_id' => 'required|integer',
            'firstname'      => 'required|string|max:255',
            'lastname'       => 'required|string|max:255',
            'phone'          => 'required|string|max:30',
            'amount'         => 'required|integer|min:1',
            'months'         => 'required|integer|in:1,3,6,9,12',
            'plan'           => 'required|in:pro,business',
        ]);

        $organization = $request->user()->organization;
        $expectedAmount = Organization::PLAN_PRICES[$validated['plan']] * $validated['months'];

        if ((int) $validated['amount'] !== $expectedAmount) {
            return response()->json([
                'success' => false,
                'message' => 'Le montant du paiement ne correspond pas au plan choisi.',
            ], 422);
        }

        FedaPay::setApiKey(config('services.fedapay.secret_key'));
        FedaPay::setEnvironment(config('services.fedapay.env'));

        try {
            $transaction = Transaction::retrieve($validated['transaction_id']);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction FedaPay introuvable ou invalide.',
            ], 422);
        }

        if (($transaction->status ?? null) !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Le paiement n\'a pas ete approuve.',
            ], 422);
        }

        if ((int) ($transaction->amount ?? 0) !== $expectedAmount) {
            return response()->json([
                'success' => false,
                'message' => 'Le montant valide par FedaPay ne correspond pas au plan choisi.',
            ], 422);
        }

        $limits = Organization::PLAN_LIMITS[$validated['plan']];
        $planExpiresAt = now()->addMonths($validated['months']);

        $updatedOrganization = DB::transaction(function () use ($validated, $organization, $limits, $planExpiresAt) {
            $organization->update([
                'plan'            => $validated['plan'],
                'plan_started_at' => now(),
                'plan_expires_at' => $planExpiresAt,
                'max_users'       => $limits['max_users'],
                'max_invoices'    => $limits['max_invoices'],
                'is_active'       => true,
            ]);

            return $organization->fresh();
        });

        return response()->json([
            'success' => true,
            'message' => 'Le plan a ete mis a jour avec succes.',
            'data'    => $updatedOrganization,
        ]);
    }

    // DELETE /api/organizations/{id}
    public function destroy(Request $request, Organization $organization): JsonResponse
    {
        $user = $request->user();

        if ((int) $user->organization_id !== (int) $organization->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas supprimer cette organisation.',
            ], 403);
        }

        if (!in_array($user->role, ['admin', 'superAdmin'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les administrateurs peuvent supprimer l\'organisation.',
            ], 403);
        }

        $currentToken = $user->currentAccessToken();

        // Supprimer le logo du storage si existe
        if ($organization->logo) {
            $oldPath = str_replace('/storage/', 'public/', parse_url($organization->logo, PHP_URL_PATH));
            Storage::delete($oldPath);
        }

        $organization->delete();
        $currentToken?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Organisation supprimée',
        ]);
    }

    // PUT /api/organization/emcef — sauvegarder les paramètres
    public function updateemcef(Request $request): JsonResponse
    {
        $request->validate([
            'ifu'         => 'required|string|max:13',
            'emcef_token' => 'required|string',
            'emcef_nim'   => 'nullable|string|max:20',
        ]);

        $org = $request->user()->organization;

        // Vérifier que le token est valide avant de sauvegarder
        $isValid = $this->verifyToken($request->emcef_token, $request->ifu);

        if (!$isValid) {
            return response()->json([
                'success' => false,
                'message' => 'Token e-MCF invalide ou expiré. Vérifiez vos paramètres DGI.',
            ], 422);
        }

        $org->update([
            'ifu'         => $request->ifu,
            'emcef_token' => $request->emcef_token,
            'emcef_nim'   => $request->emcef_nim,
            'emcef_active'=> true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Paramètres e-MCF enregistrés et vérifiés avec succès.',
            'data'    => [
                'ifu'          => $org->ifu,
                'emcef_nim'    => $org->emcef_nim,
                'emcef_active' => $org->emcef_active,
                'can_normalize'=> $org->canNormalize(),
            ],
        ]);
    }

    // DELETE /api/organization/emcef — désactiver e-MCF
    public function disable(Request $request): JsonResponse
    {
        $request->user()->organization->update([
            'emcef_active' => false,
            'emcef_token'  => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'e-MCF désactivé.',
        ]);
    }

    // Vérifier que le token est valide via l'API e-MCF
    private function verifyToken(string $token, string $ifu): bool
    {
        try {
            $url = app()->environment('production')
                ? 'https://sygmef.impots.bj/emcf/api/invoice'
                : 'https://developper.impots.bj/sygmef-emcf/api/invoice';

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'Content-Type'  => 'application/json',
                'Accept'        => 'application/json',
            ])->timeout(10)->get($url);

            if (!$response->successful()) return false;

            $data = $response->json();

            // Vérifier que le token est valide et que l'IFU correspond
            return isset($data['status'])
                && $data['status'] === true
                && isset($data['ifu'])
                && $data['ifu'] === $ifu;

        } catch (\Exception $e) {
            return false;
        }
    }
}
