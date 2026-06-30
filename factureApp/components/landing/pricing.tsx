import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    plan: "free",
    price: "0",
    description: "Pour tester la gestion de factures sans engagement",
    features: [
      "3 factures par mois",
      "1 utilisateur",
      "Gestion clients basique",
      "Aperçu et export PDF normalisé",
    ],
    cta: "Commencer gratuitement",
    popular: false,
  },
  {
    name: "Pro",
    plan: "pro",
    price: "5000",
    description: "Pour les freelances et petites entreprises actives",
    features: [
      "Factures illimitées",
      "5 utilisateurs",
      "Factures de vente normalisées",
      "Clients et statuts de paiement",
      "PDF professionnel téléchargeable",
      "Support prioritaire",
    ],
    cta: "Essayer Pro",
    popular: true,
  },
]

export function Pricing() {
  return (
    <section id="tarifs" className="bg-muted/50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Des tarifs simples pour démarrer vite
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choisissez le plan adapté à votre activité. Vous pouvez évoluer quand votre volume de factures augmente.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:mt-16 lg:grid-cols-2">
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
                  <span className="text-4xl font-bold text-foreground">{plan.price} FCFA</span>
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
