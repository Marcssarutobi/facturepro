<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Reminder;
use App\Models\Organization;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $organization = $user->organization;

        // Statistiques générales
        $totalCustomers = Customer::where('organization_id', $organization->id)->count();
        $totalInvoices = Invoice::where('organization_id', $organization->id)->count();
        $totalRevenue = Invoice::where('organization_id', $organization->id)
            ->where('status', 'paid')
            ->sum('total_ttc');
        $pendingInvoices = Invoice::where('organization_id', $organization->id)
            ->where('status', '!=', 'paid')
            ->where('due_at', '<', Carbon::now())
            ->count();
        $totalReminders = Reminder::where('organization_id', $organization->id)->count();
        $pendingReminders = Reminder::where('organization_id', $organization->id)
            ->whereNull('sent_at')
            ->count();

        // Clients actifs (ceux avec des factures récentes)
        $activeCustomers = Customer::where('organization_id', $organization->id)
            ->whereHas('invoices', function ($query) {
                $query->where('created_at', '>=', Carbon::now()->subMonths(3));
            })
            ->count();

        // Revenus mensuels (derniers 12 mois)
        $monthlyRevenue = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $month = $date->format('Y-m');
            $revenue = Invoice::where('organization_id', $organization->id)
                ->where('status', 'paid')
                ->whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->sum('total_ttc');
            $monthlyRevenue[] = [
                'month' => $date->format('M Y'),
                'revenue' => (float) $revenue
            ];
        }

        // Statuts des factures
        $invoiceStatuses = Invoice::where('organization_id', $organization->id)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        $paidInvoices = Invoice::where('organization_id', $organization->id)->where('status', 'paid')->count();
        $pendingAmount = Invoice::where('organization_id', $organization->id)
            ->where('status', '!=', 'paid')
            ->where('due_at', '<', Carbon::now())
            ->sum('total_ttc');
        $currentMonthRevenue = Invoice::where('organization_id', $organization->id)
            ->where('status', 'paid')
            ->whereYear('created_at', Carbon::now()->year)
            ->whereMonth('created_at', Carbon::now()->month)
            ->sum('total_ttc');

        // Factures récentes
        $recentInvoices = Invoice::where('organization_id', $organization->id)
            ->with('customer')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($invoice) {
                return [
                    'id' => $invoice->id,
                    'number' => $invoice->invoice_number,
                    'customer' => $invoice->customer->fullname ?? 'Client anonyme',
                    'amount' => (float) $invoice->total_ttc,
                    'status' => $invoice->status,
                    'date' => $invoice->created_at->format('Y-m-d'),
                ];
            });

        return response()->json([
            'summary' => [
                'total_customers' => $totalCustomers,
                'total_invoices' => $totalInvoices,
                'total_revenue' => (float) $totalRevenue,
                'pending_invoices' => $pendingInvoices,
                'total_reminders' => $totalReminders,
                'pending_reminders' => $pendingReminders,
                'active_customers' => $activeCustomers,
                'paid_invoices' => $paidInvoices,
                'pending_amount' => (float) $pendingAmount,
                'monthly_revenue' => (float) $currentMonthRevenue,
            ],
            'charts' => [
                'monthly_revenue' => $monthlyRevenue,
                'invoice_statuses' => $invoiceStatuses,
            ],
            'recent_invoices' => $recentInvoices,
        ]);
    }
}
