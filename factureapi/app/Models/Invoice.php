<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [ 'invoice_number', 'status', 'due_at', 'total_ht', 'total_ttc', 'customer_id', 'user_id', 'organization_id', 'echeance_at', 'total_tva', 'emcef_uid',
    'emcef_code',
    'emcef_qr_code',
    'emcef_nim',
    'emcef_counters',
    'emcef_datetime',
    'is_normalized',
    'payment_type','anonymous_customer_name' ];

    protected $casts = [ 'due_at' => 'date', 'echeance_at' => 'date', 'total_ht' => 'decimal:2', 'total_ttc' => 'decimal:2', 'total_tva' => 'decimal:2', 'is_normalized'  => 'boolean',
    'emcef_datetime' => 'datetime', ];

    // Appartient à une organisation
    public function organization(): BelongsTo { return $this->belongsTo(Organization::class); }
    // Appartient à un client
    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
    // Créée par un utilisateur
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    // Contient plusieurs lignes de commande
    public function items(): HasMany { return $this->hasMany(InvoiceItems::class); }

    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class);
    }

}
