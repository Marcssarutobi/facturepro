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
            // Type de facture normalisée : FV = facture de vente, FA = facture d'avoir.
            $table->enum('type', ['FV', 'FA'])->default('FV')->after('status');

            // Facture de vente d'origine, uniquement renseignée pour un avoir.
            $table->foreignId('original_invoice_id')
                ->nullable()
                ->after('customer_id')
                ->constrained('invoices')
                ->nullOnDelete();

            // Portée de l'avoir : 'total' (toute la facture) ou 'partiel' (un seul article).
            $table->enum('credit_scope', ['total', 'partiel'])->nullable()->after('original_invoice_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('original_invoice_id');
            $table->dropColumn(['type', 'credit_scope']);
        });
    }
};
