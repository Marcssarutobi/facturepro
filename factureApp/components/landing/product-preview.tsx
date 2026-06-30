import Image from "next/image"
import { CheckCircle2 } from "lucide-react"

const highlights = [
  {
    title: "Informations client centralisées",
    description: "Sélectionnez un client existant ou ajoutez ses coordonnées au moment de créer la facture.",
  },
  {
    title: "Calculs plus simples",
    description: "Ajoutez vos prestations, quantités, prix, taxes et remises avec un total lisible immédiatement.",
  },
  {
    title: "Aperçu et téléchargement PDF",
    description: "Prévisualisez la facture de vente normalisée, vérifiez le rendu, puis téléchargez le PDF professionnel.",
  },
]

export function ProductPreview() {
  return (
    <section id="demo" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative order-2 lg:order-1">
            <div className="overflow-hidden rounded-xl border bg-card shadow-lg">
              <Image
                src="/apercu.png"
                alt="Aperçu de l'interface de création d'une facture de vente normalisée"
                width={900}
                height={600}
                className="w-full"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Un workflow pensé pour facturer sans friction
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              L'interface vous guide étape par étape : client, lignes de facture,
              vérification, puis génération du PDF normalisé. Tout reste lisible,
              même quand vous gérez plusieurs factures en parallèle.
            </p>

            <div className="mt-8 space-y-6">
              {highlights.map((highlight) => (
                <div key={highlight.title} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{highlight.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{highlight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
