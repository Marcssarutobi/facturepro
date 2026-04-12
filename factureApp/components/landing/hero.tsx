import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Users, FileText, ThumbsUp } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pb-16 pt-8 sm:pb-24 sm:pt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 gap-1.5 px-4 py-1.5">
            <span className="text-primary">&#10022;</span>
            Facturation simplifiée pour les pros
          </Badge>

          {/* Heading */}
          <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Créez vos factures en moins de{" "}
            <span className="text-primary">60 secondes</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            FacturaPro est la solution de facturation la plus simple pour les freelances 
            et petites entreprises. Générez des factures professionnelles, suivez vos 
            paiements et relancez automatiquement vos clients.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 px-8" asChild>
              <Link href="/dashboard">
                Commencer gratuitement
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link href="#demo">
                <Play className="h-4 w-4" />
                Voir une démo
              </Link>
            </Button>
          </div>

          {/* Hero Image */}
          <div className="mt-12 w-full max-w-5xl sm:mt-16">
            <div className="relative overflow-hidden rounded-xl border bg-card shadow-2xl">
              <Image
                src="https://placehold.co/1200x700/f8f9fa/e2e8f0?text=Dashboard+FacturaPro"
                alt="Aperçu du dashboard FacturaPro"
                width={1200}
                height={700}
                className="w-full"
                priority
              />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid w-full max-w-2xl grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-12">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground sm:text-3xl">500+</span>
              </div>
              <span className="mt-1 text-sm text-muted-foreground">Freelances actifs</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground sm:text-3xl">12 000+</span>
              </div>
              <span className="mt-1 text-sm text-muted-foreground">Factures générées</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground sm:text-3xl">98%</span>
              </div>
              <span className="mt-1 text-sm text-muted-foreground">Clients satisfaits</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
