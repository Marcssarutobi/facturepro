import Image from "next/image"
import { CheckCircle2 } from "lucide-react"

const highlights = [
  {
    title: "Interface intuitive",
    description: "Pas besoin de formation. Créez votre première facture en quelques clics.",
  },
  {
    title: "Aperçu en temps réel",
    description: "Visualisez votre facture pendant que vous la créez.",
  },
  {
    title: "Export PDF instantané",
    description: "Téléchargez ou envoyez directement par email.",
  },
]

export function ProductPreview() {
  return (
    <section id="demo" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Image */}
          <div className="relative order-2 lg:order-1">
            <div className="overflow-hidden rounded-xl border bg-card shadow-lg">
              <Image
                src="https://placehold.co/900x600/ffffff/cbd5e1?text=Aperçu+Interface+Facture"
                alt="Aperçu de l'interface de création de facture"
                width={900}
                height={600}
                className="w-full"
              />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Un outil pensé pour aller vite
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Notre interface a été conçue avec un seul objectif : vous permettre de 
              facturer rapidement pour que vous puissiez vous concentrer sur votre métier.
            </p>

            {/* Highlights */}
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
