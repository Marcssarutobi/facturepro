<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemTemplate extends Model
{
    use HasFactory;

    protected $fillable = ['organization_id', 'description', 'unit_price', 'vat_rate'];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'vat_rate' => 'decimal:2',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
