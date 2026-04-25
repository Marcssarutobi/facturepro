<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // GET /api/users
    public function index(Request $request): JsonResponse
    {
        $users = User::where('organization_id', $request->user()->organization_id)
            ->with('invitedBy')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    // POST /api/users/invite
    public function invite(Request $request): JsonResponse
    {
        if (!$request->user()->organization->canAddUser()) {
            return response()->json([
                'success' => false,
                'message' => 'Limite d\'utilisateurs atteinte. Passez au plan superieur.',
            ], 403);
        }

        $validated = $request->validate([
            'fullname' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|in:member,admin,superAdmin',
        ]);

        $plainPassword = str()->random(16);

        $user = User::create([
            ...$validated,
            'password' => Hash::make($plainPassword),
            'organization_id' => $request->user()->organization_id,
            'invited_by' => $request->user()->id,
            'status' => 'inactif',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur cree',
            'data' => $user,
            'password' => $plainPassword,
        ], 201);
    }

    // GET /api/users/{id}
    public function show(Request $request, User $user): JsonResponse
    {
        $this->ensureUserAccess($request, $user);

        $user->load(['organization', 'invitedBy', 'invoices']);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    // PUT /api/users/{id}
    public function update(Request $request, User $user): JsonResponse
    {
        $this->ensureUserAccess($request, $user);

        $validated = $request->validate([
            'fullname' => 'sometimes|string|max:255',
            'role' => 'sometimes|in:member,admin,superAdmin',
            'status' => 'sometimes|in:actif,suspendu,inactif',
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur mis a jour',
            'data' => $user,
        ]);
    }

    // DELETE /api/users/{id}
    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->ensureUserAccess($request, $user);

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur supprime',
        ]);
    }

    // POST /api/login
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect',
            ], 401);
        }

        if ($user->status !== 'actif') {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte est suspendu ou inactif',
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Connexion reussie',
            'token' => $token,
            'data' => $user->load('organization'),
        ]);
    }

    // POST /api/logout
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Deconnexion reussie',
        ]);
    }

    // GET /api/me
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['organization', 'invitedBy']);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    private function ensureUserAccess(Request $request, User $user): void
    {
        if ((int) $request->user()->organization_id === (int) $user->organization_id) {
            return;
        }

        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Vous ne pouvez pas acceder a cet utilisateur.',
        ], 403));
    }
}
