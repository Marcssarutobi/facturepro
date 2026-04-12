<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [ 'fullname', 'email', 'password', 'organization_id', 'role', 'invited_by', 'status' ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Appartient à une organisation
    public function organization(): BelongsTo { return $this->belongsTo(Organization::class); }
    // A été invité par un autre utilisateur
    public function invitedBy(): BelongsTo { return $this->belongsTo(User::class, 'invited_by'); }
    // A invité d'autres utilisateurs
    public function invitedUsers(): HasMany { return $this->hasMany(User::class, 'invited_by'); }
    // A créé plusieurs factures
    public function invoices(): HasMany { return $this->hasMany(Invoice::class); }
}
