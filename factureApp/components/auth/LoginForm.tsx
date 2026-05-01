"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from "@/hooks/use-toast"
import { clearStoredSession, getDefaultRouteForUser, parseStoredUser } from "@/lib/auth"

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = parseStoredUser(localStorage.getItem('user'))

    if (token && user) {
      if (user.status === 'actif') {
        router.replace(getDefaultRouteForUser(user))
      } else {
        clearStoredSession()
        setError('Votre compte est suspendu ou inactif. Contactez votre administrateur.')
        toast({
          variant: "destructive",
          title: "Acces refuse",
          description: "Votre compte est suspendu ou inactif. Contactez votre administrateur.",
        })
      }
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email et mot de passe requis');
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "Veuillez entrer votre email et votre mot de passe.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await axiosInstance.post('/login', { email, password });

      if (!res.data || res.status !== 200) {
        setError(res.data.message || 'Erreur lors de la connexion');
        setLoading(false);
        return;
      }

      if (res.data.token) {
        try {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.data));
        } catch {}
      }

      toast({
        title: "Connexion reussie",
        description: `Bienvenue ${res.data.data.fullname}!`,
      })

      setTimeout(() => router.push(getDefaultRouteForUser(res.data.data)), 200);
    } catch (_err) {
      setError('Erreur reseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {error && <div role="alert" className="text-sm text-destructive">{error}</div>}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="admin@exemple.com"
          aria-invalid={!!error}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">Mot de passe</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Mot de passe"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground px-2 py-1 rounded"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? 'Masquer' : 'Afficher'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4" />
          <span>Se souvenir de moi</span>
        </label>
        <a href="#" className="text-primary underline">Mot de passe oublie?</a>
      </div>

      <div>
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Pas encore de compte? <a href="/register" className="text-primary underline">Creer une organisation</a>
      </div>
    </form>
  );
}
