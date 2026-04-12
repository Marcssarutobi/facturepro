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
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('adresse');
            $table->string('logo')->nullable();
            $table->string('email')->unique();
            $table->string('phone')->unique();

            // Abonnement
            $table->enum('plan', ['free', 'pro', 'business'])->default('free');
            $table->date('plan_started_at')->nullable();  // date début abonnement
            $table->date('plan_expires_at')->nullable();  // date fin abonnement
            $table->boolean('is_active')->default(true);  // organisation active ou suspendue

            // Limites selon le plan (mis à jour automatiquement quand le plan change)
            $table->integer('max_users')->default(1);      // free=1, pro=3, business=null
            $table->integer('max_invoices')->nullable();   // free=3/mois, pro=null, business=null

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
