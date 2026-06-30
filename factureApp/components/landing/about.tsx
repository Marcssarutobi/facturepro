import { Card, CardContent } from "@/components/ui/card"
import { Building2, FileText, Handshake } from "lucide-react"

const values = [
  {
    icon: FileText,
    title: "Clarté",
    description: "Des factures lisibles, structurées et faciles à retrouver quand vous en avez besoin.",
  },
  {
    icon: Building2,
    title: "Simplicité",
    description: "Une interface directe, pensée pour les indépendants, TPE et équipes qui veulent aller vite.",
  },
  {
    icon: Handshake,
    title: "Fiabilité",
    description: "Un espace de travail stable pour suivre votre activité et garder vos documents au même endroit.",
  },
]

export function About() {
  return (
    <section id="apropos" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              À propos
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Un outil de facturation conçu pour les professionnels qui avancent
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              FacturaPro aide les freelances, petites entreprises et équipes à
              produire des factures propres, suivre les paiements et garder une
              relation client plus organisée. Notre objectif est simple : réduire
              le temps passé sur l'administratif pour vous laisser plus de place
              pour votre métier.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {values.map((value) => (
              <Card key={value.title} className="border-border/50">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <value.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{value.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
