<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
     // GET /api/users — membres de l'organisation connectée
     public function index(Request $request): JsonResponse
     {
         $users = User::where('organization_id', $request->user()->organization_id)
             ->with('invitedBy')
             ->get();

         return response()->json([
             'success' => true,
             'data'    => $users,
         ]);
     }

    // POST /api/users/invite — inviter un membre
    public function invite(Request $request): JsonResponse
    {
        // ✅ Vérification limite utilisateurs
        if (!$request->user()->organization->canAddUser()) {
            return response()->json([
                'success' => false,
                'message' => 'Limite d\'utilisateurs atteinte. Passez au plan supérieur.',
            ], 403);
        }

        $validated = $request->validate([
            'fullname' => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'role'     => 'required|in:member,admin,superAdmin',
        ]);

        $plainPassword = str()->random(16);

        $user = User::create([
            ...$validated,
            'password'        => Hash::make($plainPassword),
            'organization_id' => $request->user()->organization_id,
            'invited_by'      => $request->user()->id,
            'status'          => 'inactif',
        ]);

        return response()->json([
            'success'  => true,
            'message'  => 'Utilisateur créé',
            'data'     => $user,
            'password' => $plainPassword,
        ], 201);
    }


     // GET /api/users/{id}
     public function show(User $user): JsonResponse
     {
         $user->load(['organization', 'invitedBy', 'invoices']);

         return response()->json([
             'success' => true,
             'data'    => $user,
         ]);
     }

     // PUT /api/users/{id}
     public function update(Request $request, User $user): JsonResponse
     {
         $validated = $request->validate([
             'fullname' => 'sometimes|string|max:255',
             'role'     => 'sometimes|in:member,admin,superAdmin',
             'status'   => 'sometimes|in:actif,suspendu,inactif',
         ]);

         $user->update($validated);

         return response()->json([
             'success' => true,
             'message' => 'Utilisateur mis à jour',
             'data'    => $user,
         ]);
     }

     // DELETE /api/users/{id}
     public function destroy(User $user): JsonResponse
     {
         $user->delete();

         return response()->json([
             'success' => true,
             'message' => 'Utilisateur supprimé',
         ]);
     }

     // POST /api/login
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        // Vérifier si l'utilisateur existe et le mot de passe est correct
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect',
            ], 401);
        }

        // Vérifier si le compte est actif
        if ($user->status !== 'actif') {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte est suspendu ou inactif',
            ], 403);
        }

        // Supprimer les anciens tokens et créer un nouveau
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie',
            'token'   => $token,
            'data'    => $user->load('organization'),
        ]);
    }

    // POST /api/logout
    public function logout(Request $request): JsonResponse
    {
        // Supprimer uniquement le token courant
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie',
        ]);
    }

    // GET /api/me
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['organization', 'invitedBy']);

        return response()->json([
            'success' => true,
            'data'    => $user,
        ]);
    }

}
