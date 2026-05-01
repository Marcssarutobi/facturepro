<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => env('SUPER_ADMIN_EMAIL', 'superadmin@facturapro.com')],
            [
                'fullname' => env('SUPER_ADMIN_NAME', 'Super Admin'),
                'password' => Hash::make(env('SUPER_ADMIN_PASSWORD', 'SuperAdmin@123')),
                'organization_id' => null,
                'role' => 'superAdmin',
                'status' => 'actif',
                'invited_by' => null,
            ]
        );
    }
}
