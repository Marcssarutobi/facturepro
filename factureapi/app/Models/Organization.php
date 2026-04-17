<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'adresse', 'logo', 'plan',
        'plan_started_at', 'plan_expires_at',
        'is_active', 'max_users', 'max_invoices', 'email', 'phone',
        'ifu',           // ← nouveau
        'emcef_token',   // ← nouveau
        'emcef_nim',     // ← nouveau
        'emcef_active',  // ← nouveau
    ];

    protected $casts = [
        'plan_started_at' => 'date',
        'plan_expires_at' => 'date',
        'is_active'       => 'boolean',
        'emcef_active'    => 'boolean',
        'emcef_token'    => 'encrypted',
        'ifu'    => 'encrypted',
    ];

    // ─────────────────────────────────────────
    // Limites par plan
    // ─────────────────────────────────────────
    const PLAN_LIMITS = [
        'free' => [
            'max_users'    => 1,
            'max_invoices' => 3,
        ],
        'pro' => [
            'max_users'    => 5,//3
            'max_invoices' => null,
        ],
        'business' => [
            'max_users'    => null,
            'max_invoices' => null,
        ],
    ];

    // ─────────────────────────────────────────
    // Fonctionnalités par plan
    // ─────────────────────────────────────────
    const PLAN_FEATURES = [
        'free' => [
            'auto_reminders'   => false,
            'full_dashboard'   => false,
            'email_support'    => false,
            'priority_support' => false,
            'api_access'       => false,
            'advanced_custom'  => false,
            'detailed_reports' => false,
            'pdf_export'       => true,
            'client_management'=> true,
            'email_invoices'   => false
        ],
        'pro' => [
            'auto_reminders'   => true,
            'full_dashboard'   => true,
            'email_support'    => true,
            'priority_support' => false,
            'api_access'       => false,
            'advanced_custom'  => false,
            'detailed_reports' => false,
            'pdf_export'       => true,
            'client_management'=> true,
            'email_invoices'   => true
        ],
        'business' => [
            'auto_reminders'   => true,
            'full_dashboard'   => true,
            'email_support'    => true,
            'priority_support' => true,
            'api_access'       => true,
            'advanced_custom'  => true,
            'detailed_reports' => true,
            'pdf_export'       => true,
            'client_management'=> true,
            'email_invoices'   => true
        ],
    ];

    // ─────────────────────────────────────────
    // Prix par plan
    // ─────────────────────────────────────────
    const PLAN_PRICES = [
        'free'     => 0,
        'pro'      => 5000,
        'business' => 12000,
    ];

    // ─────────────────────────────────────────
    // Mise à jour automatique quand le plan change
    // ─────────────────────────────────────────
    protected static function booted(): void
    {
        static::updating(function (Organization $org) {
            if ($org->isDirty('plan')) {
                $limits = self::PLAN_LIMITS[$org->plan];
                $org->max_users       = $limits['max_users'];
                $org->max_invoices    = $limits['max_invoices'];
                $org->plan_started_at = now();
            }
        });
    }

    // ─────────────────────────────────────────
    // Vérifications limites
    // ─────────────────────────────────────────

    // Vérifie si l'org peut encore ajouter des utilisateurs
    public function canAddUser(): bool
    {
        if (is_null($this->max_users)) return true;
        return $this->users()->count() < $this->max_users;
    }

    // Vérifie si l'org peut encore créer des factures ce mois-ci
    public function canCreateInvoice(): bool
    {
        if (is_null($this->max_invoices)) return true;

        $invoicesThisMonth = $this->invoices()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return $invoicesThisMonth < $this->max_invoices;
    }

    // Vérifie si l'abonnement est expiré
    public function isExpired(): bool
    {
        if (is_null($this->plan_expires_at)) return false;
        return $this->plan_expires_at->isPast();
    }

    // ─────────────────────────────────────────
    // Vérification fonctionnalités
    // ─────────────────────────────────────────

    // Vérifie si le plan a accès à une fonctionnalité
    public function hasFeature(string $feature): bool
    {
        return self::PLAN_FEATURES[$this->plan][$feature] ?? false;
    }

    // Retourne toutes les fonctionnalités du plan actuel
    public function features(): array
    {
        return self::PLAN_FEATURES[$this->plan] ?? [];
    }

    // Retourne le prix du plan actuel
    public function price(): int
    {
        return self::PLAN_PRICES[$this->plan] ?? 0;
    }

    // Retourne les limites du plan actuel
    public function limits(): array
    {
        return self::PLAN_LIMITS[$this->plan] ?? [];
    }

    // Retourne un résumé complet du plan pour l'API
    public function planSummary(): array
    {
        return [
            'plan'         => $this->plan,
            'price'        => $this->price(),
            'limits'       => [
                'max_users'          => $this->max_users,
                'max_invoices'       => $this->max_invoices,
                'users_count'        => $this->users()->count(),
                'invoices_this_month'=> $this->invoices()
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
                'can_add_user'       => $this->canAddUser(),
                'can_create_invoice' => $this->canCreateInvoice(),
            ],
            'features'     => $this->features(),
            'is_active'    => $this->is_active,
            'is_expired'   => $this->isExpired(),
            'started_at'   => $this->plan_started_at,
            'expires_at'   => $this->plan_expires_at,
        ];
    }

    // ─────────────────────────────────────────
    // Relations
    // ─────────────────────────────────────────
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class);
    }

    // Vérifie si l'organisation peut normaliser ses factures
    public function canNormalize(): bool
    {
        return $this->emcef_active
            && !empty($this->ifu)
            && !empty($this->emcef_token);
    }

    // Retourne l'URL de l'API e-MCF selon l'env
    public function emcefInvoiceUrl(): string
    {
        return app()->environment('production')
            ? 'https://sygmef.impots.bj/emcf/api/invoice'
            : 'https://developper.impots.bj/sygmef-emcf/api/invoice';
    }
}
