<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
            'data' => $customers,
        ]);
    }

    // POST /api/customers
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fullname' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'adresse' => 'nullable|string',
        ]);

        $customer = Customer::create([
            ...$validated,
            'organization_id' => $request->user()->organization_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Client cree avec succes',
            'data' => $customer,
        ], 201);
    }

    // GET /api/customers/{id}
    public function show(Request $request, Customer $customer): JsonResponse
    {
        $this->ensureCustomerAccess($request, $customer);

        $customer->load('invoices');

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }

    // PUT /api/customers/{id}
    public function update(Request $request, Customer $customer): JsonResponse
    {
        $this->ensureCustomerAccess($request, $customer);

        $validated = $request->validate([
            'fullname' => 'sometimes|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'adresse' => 'nullable|string',
        ]);

        $customer->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Client mis a jour',
            'data' => $customer,
        ]);
    }

    // DELETE /api/customers/{id}
    public function destroy(Request $request, Customer $customer): JsonResponse
    {
        $this->ensureCustomerAccess($request, $customer);

        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Client supprime',
        ]);
    }

    private function ensureCustomerAccess(Request $request, Customer $customer): void
    {
        if ((int) $request->user()->organization_id === (int) $customer->organization_id) {
            return;
        }

        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Vous ne pouvez pas acceder a ce client.',
        ], 403));
    }
}
