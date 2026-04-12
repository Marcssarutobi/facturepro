<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;

class CustomerController extends Controller
{
     // GET /api/customers
     public function index(Request $request): JsonResponse
     {
         $customers = Customer::where('organization_id', $request->user()->organization_id)
             ->with('invoices')
             ->withCount('invoices')
             ->latest()
             ->get();

         return response()->json([
             'success' => true,
             'data'    => $customers,
         ]);
     }

     // POST /api/customers
     public function store(Request $request): JsonResponse
     {
         $validated = $request->validate([
             'fullname' => 'required|string|max:255',
             'email'    => 'nullable|email',
             'phone'    => 'nullable|string|max:20',
             'adresse'  => 'nullable|string',
         ]);

         $customer = Customer::create([
             ...$validated,
             'organization_id' => $request->user()->organization_id,
         ]);

         return response()->json([
             'success' => true,
             'message' => 'Client créé avec succès',
             'data'    => $customer,
         ], 201);
     }

     // GET /api/customers/{id}
     public function show(Customer $customer): JsonResponse
     {
         $customer->load('invoices');

         return response()->json([
             'success' => true,
             'data'    => $customer,
         ]);
     }

     // PUT /api/customers/{id}
     public function update(Request $request, Customer $customer): JsonResponse
     {
         $validated = $request->validate([
             'fullname' => 'sometimes|string|max:255',
             'email'    => 'nullable|email',
             'phone'    => 'nullable|string|max:20',
             'adresse'  => 'nullable|string',
         ]);

         $customer->update($validated);

         return response()->json([
             'success' => true,
             'message' => 'Client mis à jour',
             'data'    => $customer,
         ]);
     }

     // DELETE /api/customers/{id}
     public function destroy(Customer $customer): JsonResponse
     {
         $customer->delete();

         return response()->json([
             'success' => true,
             'message' => 'Client supprimé',
         ]);
     }
}
