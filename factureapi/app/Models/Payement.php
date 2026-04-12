<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payement extends Model
{
    use HasFactory;

    protected $fillable = [
        'firstname', 'lastname', 'phone', 'amount', 'months',
        'plan', 'org_name', 'org_email', 'org_phone'
    ];
}
