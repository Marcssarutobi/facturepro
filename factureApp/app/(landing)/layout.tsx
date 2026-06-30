import type { Metadata } from "next"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export const metadata: Metadata = {
  title: "Logiciel de facturation et factures de vente normalisées",
  description:
    "FacturaPro permet aux indépendants et petites entreprises de créer des factures de vente normalisées, générer des PDF professionnels, suivre les paiements et gérer les clients.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FacturaPro - Logiciel de facturation en ligne",
    description:
      "Créez des factures de vente normalisées, générez vos PDF et suivez vos paiements depuis un espace SaaS simple.",
    url: "/",
    siteName: "FacturaPro",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/dashbord.png",
        width: 1200,
        height: 700,
        alt: "Dashboard FacturaPro pour la gestion de factures",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FacturaPro - Logiciel de facturation en ligne",
    description:
      "Générez des factures de vente normalisées, téléchargez vos PDF et suivez vos paiements.",
    images: ["/dashbord.png"],
  },
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
