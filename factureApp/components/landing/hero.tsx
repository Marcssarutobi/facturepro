import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileCheck2, FileText, Play, ShieldCheck } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pb-16 pt-8 sm:pb-24 sm:pt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-4 py-1.5">
            <span className="text-primary">&#10022;</span>
            Facturation simple pour indépendants et petites équipes
          </Badge>

          <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Créez, suivez et téléchargez vos{" "}
            <span className="text-primary">factures professionnelles</span>
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            FacturaPro centralise vos clients, vos factures de vente normalisées,
            vos statuts de paiement et vos PDF dans un espace clair, pensé pour
            gagner du temps sans perdre le contrôle.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 px-8" asChild>
              <Link href="/register">Commencer gratuitement</Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link href="#demo">
                <Play className="h-4 w-4" />
                Voir l'aperçu
              </Link>
            </Button>
          </div>

          <div className="mt-12 w-full max-w-5xl sm:mt-16">
            <div className="relative overflow-hidden rounded-xl border bg-card shadow-2xl">
              <Image
                src="/dashbord.png"
                alt="Dashboard FacturaPro pour suivre les factures, clients et paiements"
                width={1200}
                height={700}
                className="w-full"
                priority
              />
            </div>
          </div>

          <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-12">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground sm:text-3xl">PDF</span>
              </div>
              <span className="mt-1 text-sm text-muted-foreground">Factures prêtes à envoyer</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground sm:text-3xl">Suivi</span>
              </div>
              <span className="mt-1 text-sm text-muted-foreground">Statuts et paiements</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground sm:text-3xl">Accès</span>
              </div>
              <span className="mt-1 text-sm text-muted-foreground">Données organisées</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
