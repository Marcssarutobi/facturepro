<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [ 'fullname', 'email', 'phone', 'adresse', 'organization_id' ];

    // Appartient à une organisation
    public function organization(): BelongsTo { return $this->belongsTo(Organization::class); }
    // A reçu plusieurs factures
    public function invoices(): HasMany { return $this->hasMany(Invoice::class); }
}
