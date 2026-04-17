<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Reminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'day_offset',
        'sent_at',
        'status',
        'organization_id',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
    
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
