<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SuperAdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_access_platform_dashboard(): void
    {
        $organization = Organization::create([
            'name' => 'Acme',
            'adresse' => 'Cotonou',
            'email' => 'acme@example.com',
            'phone' => '+22997000000',
            'plan' => 'pro',
            'is_active' => true,
        ]);

        $organizationAdmin = User::create([
            'fullname' => 'Org Admin',
            'email' => 'admin@acme.test',
            'password' => 'password',
            'organization_id' => $organization->id,
            'role' => 'admin',
            'status' => 'actif',
        ]);

        Invoice::create([
            'invoice_number' => 'FAC-001',
            'status' => 'paid',
            'due_at' => now()->addDays(7),
            'echeance_at' => now()->addDays(7),
            'total_ht' => 10000,
            'total_ttc' => 12000,
            'total_tva' => 2000,
            'organization_id' => $organization->id,
            'user_id' => $organizationAdmin->id,
            'anonymous_customer_name' => 'Client Test',
        ]);

        $superAdmin = User::create([
            'fullname' => 'Platform Owner',
            'email' => 'owner@facturapro.test',
            'password' => 'password',
            'organization_id' => null,
            'role' => 'superAdmin',
            'status' => 'actif',
        ]);

        Sanctum::actingAs($superAdmin);

        $response = $this->getJson('/api/super-admin/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'summary' => [
                    'total_organizations',
                    'total_users',
                    'total_invoices',
                    'estimated_mrr',
                ],
                'charts' => [
                    'monthly_activity',
                    'plan_distribution',
                    'invoice_statuses',
                ],
                'latest_organizations',
                'attention_required_organizations',
                'recent_users',
                'recent_invoices',
            ]);
    }

    public function test_non_super_admin_cannot_access_platform_dashboard(): void
    {
        $organization = Organization::create([
            'name' => 'Beta',
            'adresse' => 'Porto-Novo',
            'email' => 'beta@example.com',
            'phone' => '+22997000001',
            'plan' => 'free',
            'is_active' => true,
        ]);

        $admin = User::create([
            'fullname' => 'Tenant Admin',
            'email' => 'tenant-admin@example.com',
            'password' => 'password',
            'organization_id' => $organization->id,
            'role' => 'admin',
            'status' => 'actif',
        ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/super-admin/dashboard')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }
}
