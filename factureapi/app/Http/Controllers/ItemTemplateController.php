<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ItemTemplate;
use Illuminate\Http\JsonResponse;

class ItemTemplateController extends Controller
{
    // GET /api/item-templates?search=xxx
    // Utilisé pour l'autocomplétion des descriptions lors de la création d'une facture.
    public function index(Request $request): JsonResponse
    {
        $query = ItemTemplate::where('organization_id', $request->user()->organization_id);

        if ($request->filled('search')) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        $templates = $query->orderBy('description')->limit(10)->get();

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }
}
