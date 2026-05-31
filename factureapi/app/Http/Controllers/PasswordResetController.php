<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    public function forgot(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();
        $code = Str::upper(Str::random(6));

        $user->reset_code = $code;
        $user->save();

        Mail::send('emails.password_reset_code', [
            'user' => $user,
            'code' => $code,
        ], function ($mail) use ($user) {
            $mail->to($user->email, $user->fullname)
                ->subject('Réinitialisation de votre mot de passe');
        });

        return response()->json([
            'success' => true,
            'message' => 'Un code de réinitialisation a été envoyé à votre e-mail.',
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string|min:4|max:10',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $request->email)
            ->where('reset_code', $request->code)
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Code de réinitialisation invalide ou email incorrect.',
            ], 422);
        }

        $user->password = Hash::make($request->password);
        $user->reset_code = null;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe mis à jour avec succès.',
        ]);
    }
}
