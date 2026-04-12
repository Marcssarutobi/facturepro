import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Quote } from "lucide-react"

const testimonials = [
  {
    quote: "FacturaPro m'a fait gagner un temps fou. Avant, je passais des heures sur mes factures. Maintenant, c'est réglé en quelques minutes.",
    name: "Amadou Diallo",
    role: "Consultant indépendant",
    avatar: "AD",
  },
  {
    quote: "L'interface est vraiment intuitive et les relances automatiques ont considérablement réduit mes impayés. Je recommande !",
    name: "Marie Dubois",
    role: "Designer freelance",
    avatar: "MD",
  },
  {
    quote: "En tant que petite agence, nous avions besoin d'un outil multi-utilisateurs abordable. FacturaPro coche toutes les cases.",
    name: "Kofi Asante",
    role: "Directeur, Studio K",
    avatar: "KA",
  },
]

export function Testimonials() {
  return (
    <section id="apropos" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ce que nos clients disent
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Découvrez pourquoi plus de 500 professionnels nous font confiance.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-12 grid gap-8 sm:mt-16 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="border-border/50 bg-card">
              <CardContent className="pt-6">
                <Quote className="mb-4 h-8 w-8 text-primary/20" />
                <p className="text-muted-foreground leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-semibold text-primary">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
