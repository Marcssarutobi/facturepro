<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('emcef_uid')->nullable();
            $table->string('emcef_code')->nullable();
            $table->text('emcef_qr_code')->nullable();
            $table->string('emcef_nim')->nullable();
            $table->string('emcef_counters')->nullable();
            $table->timestamp('emcef_datetime')->nullable();
            $table->boolean('is_normalized')->default(false);
            $table->string('payment_type')->nullable()->default('ESPECES');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            //
        });
    }
};
