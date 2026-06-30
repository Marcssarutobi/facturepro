<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Organization;
use App\Models\Payement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAdminDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $now = Carbon::now();
        $today = $now->toDateString();
        $startOfMonth = $now->copy()->startOfMonth();
        $expiringThreshold = $now->copy()->addDays(7)->toDateString();

        $totalOrganizations = Organization::count();
        $activeOrganizations = Organization::where('is_active', true)->count();
        $suspendedOrganizations = Organization::where('is_active', false)->count();
        $expiredOrganizations = Organization::whereNotNull('plan_expires_at')
            ->whereDate('plan_expires_at', '<', $today)
            ->count();
        $expiringOrganizations = Organization::whereNotNull('plan_expires_at')
            ->whereDate('plan_expires_at', '>=', $today)
            ->whereDate('plan_expires_at', '<=', $expiringThreshold)
            ->count();

        $totalUsers = User::count();
        $activeUsers = User::where('status', 'actif')->count();
        $suspendedUsers = User::where('status', 'suspendu')->count();
        $inactiveUsers = User::where('status', 'inactif')->count();

        $totalInvoices = Invoice::count();
        $paidInvoices = Invoice::where('status', 'paid')->count();
        $overdueInvoices = Invoice::where('status', '!=', 'paid')
            ->whereDate('due_at', '<', $today)
            ->count();
        $invoicesThisMonth = Invoice::whereBetween('created_at', [$startOfMonth, $now])->count();
        $freeAccounts = Organization::where('plan', 'free')->count();
        $proAccounts = Organization::where('plan', 'pro')->count();
        $businessAccounts = Organization::where('plan', 'business')->count();

        $collectedRevenue = (float) Invoice::where('status', 'paid')->sum('total_ttc');
        $monthlyRevenue = (float) Invoice::where('status', 'paid')
            ->whereBetween('created_at', [$startOfMonth, $now])
            ->sum('total_ttc');
        $overdueAmount = (float) Invoice::where('status', '!=', 'paid')
            ->whereDate('due_at', '<', $today)
            ->sum('total_ttc');

        $estimatedMrr = (float) Organization::query()
            ->where('is_active', true)
            ->where(function ($query) use ($today) {
                $query->whereNull('plan_expires_at')
                    ->orWhereDate('plan_expires_at', '>=', $today);
            })
            ->get(['plan'])
            ->sum(fn (Organization $organization) => Organization::PLAN_PRICES[$organization->plan] ?? 0);

        $subscriptionRevenue = (float) Payement::sum('amount');
        $subscriptionRevenueThisMonth = (float) Payement::whereBetween('created_at', [$startOfMonth, $now])
            ->sum('amount');
        $subscriptionPaymentsThisMonth = Payement::whereBetween('created_at', [$startOfMonth, $now])->count();

        $monthlyActivity = [];
        $subscriptionPayments = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = $now->copy()->subMonths($i);

            $monthlyActivity[] = [
                'month' => $date->locale('fr')->translatedFormat('M Y'),
                'organizations' => Organization::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
                'users' => User::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
                'invoices' => Invoice::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
                'revenue' => (float) Invoice::where('status', 'paid')
                    ->whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->sum('total_ttc'),
            ];

            $subscriptionPayments[] = [
                'month' => $date->locale('fr')->translatedFormat('M Y'),
                'amount' => (float) Payement::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->sum('amount'),
                'payments' => Payement::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
                'pro_payments' => Payement::where('plan', 'pro')
                    ->whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
                'business_payments' => Payement::where('plan', 'business')
                    ->whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
            ];
        }

        $planDistribution = collect(['free', 'pro', 'business'])->map(function (string $plan) {
            return [
                'plan' => $plan,
                'count' => Organization::where('plan', $plan)->count(),
            ];
        })->values();

        $invoiceStatuses = Invoice::query()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->status,
                'count' => (int) $row->count,
            ])
            ->values();

        $latestOrganizations = Organization::query()
            ->withCount(['users', 'invoices'])
            ->withSum([
                'invoices as total_revenue' => fn ($query) => $query->where('status', 'paid'),
            ], 'total_ttc')
            ->latest()
            ->limit(8)
            ->get()
            ->map(function (Organization $organization) use ($now) {
                return [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'email' => $organization->email,
                    'country' => $organization->country,
                    'plan' => $organization->plan,
                    'is_active' => (bool) $organization->is_active,
                    'is_expired' => $organization->isExpired(),
                    'users_count' => (int) $organization->users_count,
                    'invoices_count' => (int) $organization->invoices_count,
                    'total_revenue' => (float) ($organization->total_revenue ?? 0),
                    'plan_expires_at' => $organization->plan_expires_at?->toDateString(),
                    'days_until_expiration' => $organization->plan_expires_at
                        ? $now->copy()->startOfDay()->diffInDays($organization->plan_expires_at, false)
                        : null,
                    'created_at' => $organization->created_at?->toDateString(),
                ];
            })
            ->values();

        $attentionRequiredOrganizations = Organization::query()
            ->withCount(['users', 'invoices'])
            ->where(function ($query) use ($today, $expiringThreshold) {
                $query->where('is_active', false)
                    ->orWhere(function ($expiredQuery) use ($today) {
                        $expiredQuery->whereNotNull('plan_expires_at')
                            ->whereDate('plan_expires_at', '<', $today);
                    })
                    ->orWhere(function ($expiringQuery) use ($today, $expiringThreshold) {
                        $expiringQuery->whereNotNull('plan_expires_at')
                            ->whereDate('plan_expires_at', '>=', $today)
                            ->whereDate('plan_expires_at', '<=', $expiringThreshold);
                    });
            })
            ->orderBy('is_active')
            ->orderBy('plan_expires_at')
            ->limit(6)
            ->get()
            ->map(function (Organization $organization) use ($now) {
                return [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'plan' => $organization->plan,
                    'is_active' => (bool) $organization->is_active,
                    'is_expired' => $organization->isExpired(),
                    'users_count' => (int) $organization->users_count,
                    'invoices_count' => (int) $organization->invoices_count,
                    'plan_expires_at' => $organization->plan_expires_at?->toDateString(),
                    'days_until_expiration' => $organization->plan_expires_at
                        ? $now->copy()->startOfDay()->diffInDays($organization->plan_expires_at, false)
                        : null,
                ];
            })
            ->values();

        $latestSubscriptions = Payement::query()
            ->latest()
            ->limit(8)
            ->get()
            ->map(function (Payement $payement) {
                return [
                    'id' => $payement->id,
                    'customer_name' => trim($payement->firstname . ' ' . $payement->lastname),
                    'phone' => $payement->phone,
                    'amount' => (float) $payement->amount,
                    'months' => (int) $payement->months,
                    'plan' => $payement->plan,
                    'org_name' => $payement->org_name,
                    'org_email' => $payement->org_email,
                    'org_phone' => $payement->org_phone,
                    'created_at' => $payement->created_at?->toDateString(),
                ];
            })
            ->values();

        $recentUsers = User::query()
            ->with('organization:id,name')
            ->latest()
            ->limit(8)
            ->get()
            ->map(function (User $user) {
                return [
                    'id' => $user->id,
                    'fullname' => $user->fullname,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'organization' => $user->organization?->name ?? 'Plateforme',
                    'created_at' => $user->created_at?->toDateString(),
                ];
            })
            ->values();

        $recentInvoices = Invoice::query()
            ->with(['organization:id,name', 'customer:id,fullname'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(function (Invoice $invoice) {
                return [
                    'id' => $invoice->id,
                    'number' => $invoice->invoice_number,
                    'organization' => $invoice->organization?->name ?? 'Inconnue',
                    'customer' => $invoice->customer?->fullname ?? $invoice->anonymous_customer_name ?? 'Client anonyme',
                    'amount' => (float) $invoice->total_ttc,
                    'status' => $invoice->status,
                    'created_at' => $invoice->created_at?->toDateString(),
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'summary' => [
                'total_organizations' => $totalOrganizations,
                'active_organizations' => $activeOrganizations,
                'suspended_organizations' => $suspendedOrganizations,
                'expired_organizations' => $expiredOrganizations,
                'expiring_organizations' => $expiringOrganizations,
                'organizations_this_month' => Organization::whereBetween('created_at', [$startOfMonth, $now])->count(),
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'suspended_users' => $suspendedUsers,
                'inactive_users' => $inactiveUsers,
                'users_this_month' => User::whereBetween('created_at', [$startOfMonth, $now])->count(),
                'total_invoices' => $totalInvoices,
                'paid_invoices' => $paidInvoices,
                'overdue_invoices' => $overdueInvoices,
                'invoices_this_month' => $invoicesThisMonth,
                'free_accounts' => $freeAccounts,
                'pro_accounts' => $proAccounts,
                'business_accounts' => $businessAccounts,
                'estimated_mrr' => $estimatedMrr,
                'collected_revenue' => $collectedRevenue,
                'monthly_revenue' => $monthlyRevenue,
                'subscription_revenue' => $subscriptionRevenue,
                'subscription_revenue_this_month' => $subscriptionRevenueThisMonth,
                'subscription_payments_this_month' => $subscriptionPaymentsThisMonth,
                'overdue_amount' => $overdueAmount,
            ],
            'charts' => [
                'monthly_activity' => $monthlyActivity,
                'plan_distribution' => $planDistribution,
                'invoice_statuses' => $invoiceStatuses,
                'subscription_payments' => $subscriptionPayments,
            ],
            'latest_organizations' => $latestOrganizations,
            'attention_required_organizations' => $attentionRequiredOrganizations,
            'latest_subscriptions' => $latestSubscriptions,
            'recent_users' => $recentUsers,
            'recent_invoices' => $recentInvoices,
        ]);
    }
}
