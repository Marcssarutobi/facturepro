import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ExternalLink,
  Mail,
  ShieldCheck,
  KeyRound,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Obtenir votre token e-MCF (DGI Bénin) — Documentation",
  description:
    "Guide pas à pas pour créer votre compte e-MECeF auprès de la DGI, récupérer votre token d'authentification et l'activer dans les paramètres de votre organisation FacturaPro.",
  alternates: {
    canonical: "/documentation/emcef",
  },
}

const steps = [
  {
    title: "Créez votre compte e-MECeF auprès de la DGI",
    description:
      "Rendez-vous sur la plateforme officielle d'inscription e-MECeF de la Direction Générale des Impôts et saisissez votre numéro IFU pour démarrer la demande.",
    link: {
      href: "https://sygmef.impots.bj/emcf/registration",
      label: "sygmef.impots.bj/emcf/registration",
    },
  },
  {
    title: "Validez votre demande par email",
    description:
      "La DGI vous envoie un email de confirmation. Ouvrez-le et cliquez sur le lien pour finaliser votre demande, puis complétez les informations de votre entreprise (raison sociale, secteur d'activité, point de vente).",
  },
  {
    title: "Choisissez l'option « J'ai un SFE »",
    description:
      "Lors de la configuration de votre point de vente, sélectionnez l'option indiquant que vous utilisez votre propre Système de Facturation d'Entreprise (SFE) plutôt que l'interface en ligne fournie par la DGI — c'est le cas avec FacturaPro.",
  },
  {
    title: "Récupérez votre token d'authentification",
    description:
      "Une fois votre demande traitée par la DGI (habituellement sous 72h), vous recevez une clé d'authentification (un token). Ce token se trouve également dans votre espace e-MECeF, généralement dans la section dédiée aux clés API.",
  },
  {
    title: "Renseignez le token dans FacturaPro",
    description:
      "Connectez-vous à FacturaPro, ouvrez Organisation → Paramètres e-MCF, puis collez votre IFU et votre token dans les champs correspondants. Activez ensuite l'option « Actif EMCEF » et enregistrez.",
  },
  {
    title: "Normalisez votre première facture",
    description:
      "Une fois le token activé, vous pouvez normaliser vos factures de vente directement depuis la liste des factures. Une facture doit être envoyée ou payée avant de pouvoir être normalisée.",
  },
]

export default function EmcefDocumentationPage() {
  return (
    <div className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Documentation
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Obtenir votre token e-MCF pour la facturation normalisée
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Au Bénin, l'émission d'une facture normalisée (facture de vente ou
          avoir) passe par le système e-MECeF de la Direction Générale des
          Impôts (DGI). Ce guide vous explique comment obtenir le token
          d'authentification à renseigner dans les paramètres de votre
          organisation, avant de commencer à normaliser vos factures.
        </p>

        <Card className="mt-8 border-border/50 bg-muted/30">
          <CardContent className="flex gap-4 p-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Le token est délivré par la DGI, pas par FacturaPro. FacturaPro
              se contente de l'utiliser pour transmettre vos factures à
              l'e-MECeF en votre nom. Il vous appartient de le garder
              confidentiel.
            </p>
          </CardContent>
        </Card>

        <div className="mt-10 space-y-6">
          {steps.map((step, index) => (
            <Card key={step.title} className="border-border/50">
              <CardHeader className="flex-row items-start gap-4 space-y-0">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="pl-[3.75rem]">
                <p className="text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
                {step.link && (
                  <a
                    href={step.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {step.link.label}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-10 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-primary" />
              Où renseigner le token dans FacturaPro ?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Depuis votre espace, ouvrez le menu <strong>Organisation</strong>{" "}
              puis la section <strong>Informations supplémentaires</strong> (visible
              lorsque le pays de votre organisation est le Bénin). Vous y
              trouverez les champs IFU, Token EMCEF, NIM EMCEF et un
              interrupteur « Actif EMCEF ».
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <Link href="/organization">
                  Aller aux paramètres de l'organisation
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <a
                  href="https://sygmef.impots.bj/emcf/registration"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ouvrir la plateforme e-MECeF
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Facture de vente ou avoir : que faut-il de plus ?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Une fois votre token activé, vous pouvez normaliser une facture
              de vente directement depuis la liste des factures. Pour annuler
              ou corriger une facture déjà normalisée, créez un{" "}
              <strong>avoir</strong> : complet (toute la facture) ou partiel
              (un seul article). L'avoir référence automatiquement le code
              MECeF/DGI de la facture de vente d'origine, comme l'exige la DGI
              — vous n'avez rien à saisir manuellement.
            </p>
          </CardContent>
        </Card>

        <div className="mt-10 flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-5">
          <Mail className="h-5 w-5 flex-shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Une question sur cette procédure ?{" "}
            <a
              href="mailto:contact@facturapro.com"
              className="font-medium text-primary hover:underline"
            >
              contact@facturapro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
