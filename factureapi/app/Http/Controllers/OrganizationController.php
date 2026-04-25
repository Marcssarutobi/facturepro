<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\User;
use FedaPay\FedaPay;
use FedaPay\Transaction;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class OrganizationController extends Controller
{
    // GET /api/organizations
    public function index(Request $request): JsonResponse
    {
        $organizations = Organization::withCount(['users', 'invoices'])
            ->whereKey($request->user()->organization_id)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $organizations,
        ]);
    }

    // POST /api/organizations
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:organizations,email',
            'phone' => 'nullable|string|max:20',
            'plan' => 'required|in:free,pro,business',
            'months' => 'required_unless:plan,free|integer|in:1,3,6,9,12',
            'transaction_id' => 'required_unless:plan,free|integer',
            'adresse' => 'required|string',
            'country' => 'required|string',
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($validated['plan'] === 'free') {
            $validated['plan_expires_at'] = null;
        } else {
            $months = (int) $validated['months'];

            $this->validatePaidPlanTransaction(
                (int) $validated['transaction_id'],
                $validated['plan'],
                $months
            );

            $validated['plan_expires_at'] = now()->addMonths($months);
        }

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', 'public');
            $validated['logo'] = url(Storage::url($path));
        }

        $limits = Organization::PLAN_LIMITS[$validated['plan']];
        $validated['max_users'] = $limits['max_users'];
        $validated['max_invoices'] = $limits['max_invoices'];
        $validated['plan_started_at'] = now();
        $validated['is_active'] = true;

        $organizationData = $validated;
        unset($organizationData['months'], $organizationData['transaction_id']);

        return DB::transaction(function () use ($organizationData) {
            $organization = Organization::create($organizationData);

            $plainPassword = 'Admin@123';

            $user = User::create([
                'fullname' => 'Admin Admin',
                'email' => $organizationData['email'],
                'password' => Hash::make($plainPassword),
                'organization_id' => $organization->id,
                'role' => 'admin',
                'status' => 'actif',
                'invited_by' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Organisation creee avec succes',
                'data' => [
                    'organization' => $organization,
                    'admin' => [
                        'id' => $user->id,
                        'fullname' => $user->fullname,
                        'email' => $user->email,
                        'role' => $user->role,
                        'password' => $plainPassword,
                    ],
                ],
            ], 201);
        });
    }

    // GET /api/organizations/{id}
    public function show(Request $request, Organization $organization): JsonResponse
    {
        $this->ensureOrganizationAccess($request, $organization);

        $organization->load(['users', 'customers']);
        $organization->loadCount(['users', 'invoices']);

        return response()->json([
            'success' => true,
            'data' => array_merge($organization->toArray(), [
                'is_expired' => $organization->isExpired(),
                'can_add_user' => $organization->canAddUser(),
                'can_create_invoice' => $organization->canCreateInvoice(),
            ]),
            'emcef' => [
                'ifu' => $organization->ifu,
                'emcef_nim' => $organization->emcef_nim,
                'emcef_active' => $organization->emcef_active,
                'has_token' => !empty($organization->emcef_token),
                'can_normalize' => $organization->canNormalize(),
            ],
        ]);
    }

    // PUT /api/organizations/{id}
    public function update(Request $request, Organization $organization): JsonResponse
    {
        $this->ensureOrganizationAccess($request, $organization);

        if ($request->hasAny([
            'plan',
            'months',
            'transaction_id',
            'plan_started_at',
            'plan_expires_at',
            'max_users',
            'max_invoices',
            'is_active',
        ])) {
            return response()->json([
                'success' => false,
                'message' => 'Le changement de plan doit passer par la procedure de paiement securisee.',
            ], 422);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:organizations,email,' . $organization->id,
            'phone' => 'nullable|string|max:20',
            'adresse' => 'sometimes|string',
            'country' => 'nullable|string|max:255',
            'logo' => 'nullable|image|max:2048',
        ]);

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
            'message' => 'Organisation mise a jour',
            'data' => $organization,
        ]);
    }

    public function changePlan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transaction_id' => 'required|integer',
            'firstname' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'phone' => 'required|string|max:30',
            'amount' => 'required|integer|min:1',
            'months' => 'required|integer|in:1,3,6,9,12',
            'plan' => 'required|in:pro,business',
        ]);

        $organization = $request->user()->organization;
        $this->validatePaidPlanTransaction(
            (int) $validated['transaction_id'],
            $validated['plan'],
            (int) $validated['months'],
            (int) $validated['amount']
        );

        $limits = Organization::PLAN_LIMITS[$validated['plan']];
        $planExpiresAt = now()->addMonths((int) $validated['months']);

        $updatedOrganization = DB::transaction(function () use ($validated, $organization, $limits, $planExpiresAt) {
            $organization->update([
                'plan' => $validated['plan'],
                'plan_started_at' => now(),
                'plan_expires_at' => $planExpiresAt,
                'max_users' => $limits['max_users'],
                'max_invoices' => $limits['max_invoices'],
                'is_active' => true,
            ]);

            return $organization->fresh();
        });

        return response()->json([
            'success' => true,
            'message' => 'Le plan a ete mis a jour avec succes.',
            'data' => $updatedOrganization,
        ]);
    }

    // DELETE /api/organizations/{id}
    public function destroy(Request $request, Organization $organization): JsonResponse
    {
        $this->ensureOrganizationAccess($request, $organization);

        $user = $request->user();

        if (!in_array($user->role, ['admin', 'superAdmin'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les administrateurs peuvent supprimer l\'organisation.',
            ], 403);
        }

        $currentToken = $user->currentAccessToken();

        if ($organization->logo) {
            $oldPath = str_replace('/storage/', 'public/', parse_url($organization->logo, PHP_URL_PATH));
            Storage::delete($oldPath);
        }

        $organization->delete();
        $currentToken?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Organisation supprimee',
        ]);
    }

    // PUT /api/organization/emcef
    public function updateemcef(Request $request): JsonResponse
    {
        $request->validate([
            'ifu' => 'required|string|max:13',
            'emcef_token' => 'required|string',
            'emcef_nim' => 'nullable|string|max:20',
        ]);

        $org = $request->user()->organization;
        $isValid = $this->verifyToken($request->emcef_token, $request->ifu);

        if (!$isValid) {
            return response()->json([
                'success' => false,
                'message' => 'Token e-MCF invalide ou expire. Verifiez vos parametres DGI.',
            ], 422);
        }

        $org->update([
            'ifu' => $request->ifu,
            'emcef_token' => $request->emcef_token,
            'emcef_nim' => $request->emcef_nim,
            'emcef_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Parametres e-MCF enregistres et verifies avec succes.',
            'data' => [
                'ifu' => $org->ifu,
                'emcef_nim' => $org->emcef_nim,
                'emcef_active' => $org->emcef_active,
                'can_normalize' => $org->canNormalize(),
            ],
        ]);
    }

    // DELETE /api/organization/emcef
    public function disable(Request $request): JsonResponse
    {
        $request->user()->organization->update([
            'emcef_active' => false,
            'emcef_token' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'e-MCF desactive.',
        ]);
    }

    private function verifyToken(string $token, string $ifu): bool
    {
        try {
            $url = app()->environment('production')
                ? 'https://sygmef.impots.bj/emcf/api/invoice'
                : 'https://developper.impots.bj/sygmef-emcf/api/invoice';

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout(10)->get($url);

            if (!$response->successful()) {
                return false;
            }

            $data = $response->json();

            return isset($data['status'])
                && $data['status'] === true
                && isset($data['ifu'])
                && $data['ifu'] === $ifu;
        } catch (\Exception $exception) {
            return false;
        }
    }

    private function ensureOrganizationAccess(Request $request, Organization $organization): void
    {
        if ((int) $request->user()->organization_id === (int) $organization->id) {
            return;
        }

        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Vous ne pouvez pas acceder a cette organisation.',
        ], 403));
    }

    private function validatePaidPlanTransaction(
        int $transactionId,
        string $plan,
        int $months,
        ?int $requestedAmount = null
    ): int {
        $expectedAmount = Organization::PLAN_PRICES[$plan] * $months;

        if (!is_null($requestedAmount) && $requestedAmount !== $expectedAmount) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Le montant du paiement ne correspond pas au plan choisi.',
            ], 422));
        }

        FedaPay::setApiKey(config('services.fedapay.secret_key'));
        FedaPay::setEnvironment(config('services.fedapay.env'));

        try {
            $transaction = Transaction::retrieve($transactionId);
        } catch (\Throwable $exception) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Transaction FedaPay introuvable ou invalide.',
            ], 422));
        }

        if (($transaction->status ?? null) !== 'approved') {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Le paiement n\'a pas ete approuve.',
            ], 422));
        }

        if ((int) ($transaction->amount ?? 0) !== $expectedAmount) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Le montant valide par FedaPay ne correspond pas au plan choisi.',
            ], 422));
        }

        return $expectedAmount;
    }
}
