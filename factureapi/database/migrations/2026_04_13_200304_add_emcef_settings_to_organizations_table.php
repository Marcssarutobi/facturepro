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
        Schema::table('organizations', function (Blueprint $table) {
            $table->string('ifu')->nullable();           // IFU du contribuable
            $table->text('emcef_token')->nullable();   // Token JWT fourni par DGI
            $table->string('emcef_nim')->nullable();     // NIM de l'e-MCF
            $table->boolean('emcef_active')->default(false); // e-MCF activé ou non
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            //
        });
    }
};
