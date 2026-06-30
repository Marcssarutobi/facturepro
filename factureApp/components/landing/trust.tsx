import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Headphones, LockKeyhole, Mail, ShieldCheck } from "lucide-react"

const privacyPoints = [
  "Les données de facturation sont rattachées à votre organisation.",
  "Les accès sont limités aux utilisateurs autorisés de votre espace.",
  "Les documents générés restent liés à votre activité et à vos clients.",
]

const supportOptions = [
  {
    icon: Mail,
    title: "Contact direct",
    description: "Écrivez-nous pour une question de compte, de facturation ou d'utilisation.",
  },
  {
    icon: Headphones,
    title: "Aide opérationnelle",
    description: "Nous vous accompagnons sur les workflows clés : clients, factures, PDF et accès équipe.",
  },
]

export function Trust() {
  return (
    <section id="confidentialite" className="bg-muted/50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Confidentialité et support au cœur du service
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            FacturaPro manipule des informations sensibles. La page explique clairement
            comment nous pensons la protection des données et l'accompagnement client.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <LockKeyhole className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Politique de confidentialité</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Nous collectons uniquement les informations nécessaires au fonctionnement
                du compte : organisation, utilisateurs, clients, factures et éléments
                utiles à la génération des documents.
              </p>
              <ul className="mt-5 space-y-3">
                {privacyPoints.map((point) => (
                  <li key={point} className="flex gap-3 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card id="support" className="border-border/50">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Headphones className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {supportOptions.map((option) => (
                  <div key={option.title} className="flex gap-4">
                    <option.icon className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground">{option.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="mt-6" variant="outline" asChild>
                <Link href="mailto:contact@facturapro.com">Contacter le support</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
