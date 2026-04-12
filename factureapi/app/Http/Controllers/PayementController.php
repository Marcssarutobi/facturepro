<?php

namespace App\Http\Controllers;

use App\Models\Payement;
use Illuminate\Http\Request;
use FedaPay\FedaPay;
use FedaPay\Transaction;

class PayementController extends Controller
{

    public function verifier(Request $request){
        FedaPay::setApiKey(config('services.fedapay.secret_key'));
        FedaPay::setEnvironment(config('services.fedapay.env'));

        $transaction = Transaction::retrieve($request->transaction_id);

        if ($transaction->status === 'success') {

            $payement = new Payement();
            $payement->firstname = $request->firstname;
            $payement->lastname = $request->lastname;
            $payement->phone = $request->phone;
            $payement->amount = $request->amount;
            $payement->months = $request->months;
            $payement->plan = $request->plan;
            $payement->org_name = $request->org_name;
            $payement->org_email = $request->org_email;
            $payement->org_phone = $request->org_phone;
            $payement->save();

            // Le paiement a réussi
            return response()->json(['message' => 'Paiement réussi']);
        } else {
            // Le paiement a échoué ou est en attente
            return response()->json(['message' => 'Paiement échoué ou en attente'], 400);
        }
    }

}
