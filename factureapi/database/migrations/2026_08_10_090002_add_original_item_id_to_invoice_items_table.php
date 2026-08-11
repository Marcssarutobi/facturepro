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
        Schema::table('invoice_items', function (Blueprint $table) {
            // Renseigné uniquement pour une ligne d'avoir : la ligne de la facture
            // de vente d'origine qu'elle crédite.
            $table->foreignId('original_item_id')
                ->nullable()
                ->after('invoice_id')
                ->constrained('invoice_items')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('original_item_id');
        });
    }
};
