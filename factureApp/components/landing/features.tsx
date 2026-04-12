import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Zap, 
  Bell, 
  Users, 
  BarChart3, 
  BookUser, 
  ShieldCheck 
} from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Factures en 60s",
    description: "Formulaire rapide et intuitif. Votre PDF est généré automatiquement, prêt à être envoyé.",
  },
  {
    icon: Bell,
    title: "Relances auto",
    description: "Emails de relance automatiques à J+7 et J+14. Fini les impayés oubliés.",
  },
  {
    icon: Users,
    title: "Multi-utilisateurs",
    description: "Invitez votre équipe avec des rôles personnalisés. Gérez les accès facilement.",
  },
  {
    icon: BarChart3,
    title: "Tableau de bord",
    description: "Visualisez votre chiffre d&apos;affaires en temps réel avec des graphiques clairs.",
  },
  {
    icon: BookUser,
    title: "Gestion clients",
    description: "Carnet d&apos;adresses centralisé. Retrouvez vos clients en un clic.",
  },
  {
    icon: ShieldCheck,
    title: "100% légal",
    description: "Numérotation conforme et mentions obligatoires. Soyez en règle sans effort.",
  },
]

export function Features() {
  return (
    <section id="fonctionnalites" className="bg-muted/50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tout ce dont vous avez besoin
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Des fonctionnalités pensées pour vous faire gagner du temps et de l&apos;argent.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 bg-card transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
