import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    plan:'free',
    price: "0",
    description: "Pour commencer en douceur",
    features: [
      "3 factures par mois",
      "1 utilisateur",
      "Gestion clients basique",
      "Export PDF",
    ],
    cta: "Commencer gratuitement",
    popular: false,
  },
  {
    name: "Pro",
    plan:'pro',
    price: "5000",
    description: "Pour les freelances actifs",
    features: [
      "Factures illimitées",
      "5 utilisateurs",
      "Relances automatiques",
      "Tableau de bord complet",
      "Envoi de factures par email",
    ],
    cta: "Essayer Pro",
    popular: true,
  },
  {
    name: "Business",
    plan:'business',
    price: "12000",
    description: "Pour les équipes",
    features: [
      "Factures illimitées",
      "Utilisateurs illimités",
      "Support prioritaire",
      "Envoi de factures par email",
      "API access",
      "Personnalisation avancée",
      "Rapports détaillés",
    ],
    cta: "Contacter les ventes",
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="tarifs" className="bg-muted/50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Des tarifs simples et transparents
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choisissez le plan adapté à votre activité. Changez à tout moment.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid gap-8 sm:mt-16 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg ring-1 ring-primary"
                  : "border-border/50"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Populaire
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price} fcfa</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href={`/register?plan=${plan.plan}&price=${plan.price}`}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
