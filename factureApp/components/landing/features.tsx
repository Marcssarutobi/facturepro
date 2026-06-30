import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Clock,
  Download,
  Eye,
  FileText,
  ReceiptText,
  Users,
} from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Création de factures",
    description: "Créez des factures claires avec client, articles, taxes, remises, notes et conditions de paiement.",
  },
  {
    icon: ReceiptText,
    title: "Facture de vente normalisée",
    description: "Générez des factures de vente normalisées avec les informations essentielles de votre entreprise et de vos clients.",
  },
  {
    icon: Eye,
    title: "Aperçu détaillé",
    description: "Consultez chaque facture avant validation pour corriger rapidement les montants et les informations client.",
  },
  {
    icon: Download,
    title: "PDF professionnel",
    description: "Générez une facture PDF soignée, prête à être téléchargée, archivée ou envoyée à votre client.",
  },
  {
    icon: Clock,
    title: "Suivi des statuts",
    description: "Gardez une vue simple sur les factures brouillon, envoyées, payées ou en retard.",
  },
  {
    icon: Users,
    title: "Clients et équipe",
    description: "Centralisez vos clients et invitez vos collaborateurs pour travailler sur les mêmes dossiers.",
  },
]

export function Features() {
  return (
    <section id="fonctionnalites" className="bg-muted/50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Une gestion de factures complète et normalisée
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            FacturaPro vous accompagne de la création d'une facture de vente normalisée jusqu'au suivi du paiement.
          </p>
        </div>

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
