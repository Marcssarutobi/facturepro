<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItems extends Model
{
    use HasFactory;

    protected $fillable = [ 'description', 'quantity', 'unit_price', 'vat_rate', 'invoice_id' ];
    protected $casts = [ 'unit_price' => 'decimal:2', 'vat_rate' => 'decimal:2', ];

    // Appartient à une facture
    public function invoice(): BelongsTo { return $this->belongsTo(Invoice::class); }
    // Calcul du total HT de la ligne
    public function getTotalHtAttribute(): float { return $this->quantity * $this->unit_price; }
    // Calcul du montant TVA de la ligne
    public function getTvaAttribute(): float { return $this->getTotalHtAttribute() * $this->vat_rate; }
}
