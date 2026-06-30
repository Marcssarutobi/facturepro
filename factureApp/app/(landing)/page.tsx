import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { ProductPreview } from "@/components/landing/product-preview"
import { Pricing } from "@/components/landing/pricing"
import { Trust } from "@/components/landing/trust"
import { About } from "@/components/landing/about"
import { FAQ } from "@/components/landing/faq"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://facturapro.com"

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "FacturaPro",
      url: siteUrl,
      logo: `${siteUrl}/logoFacture.png`,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "contact@facturapro.com",
        availableLanguage: ["fr"],
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#software`,
      name: "FacturaPro",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteUrl,
      image: `${siteUrl}/dashbord.png`,
      description:
        "Logiciel SaaS de facturation pour créer des factures de vente normalisées, générer des PDF professionnels, gérer les clients et suivre les paiements.",
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "XOF",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "5000",
          priceCurrency: "XOF",
        },
      ],
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "FacturaPro permet-il de générer une facture de vente normalisée ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Oui. FacturaPro aide à créer des factures de vente normalisées avec les informations de l'entreprise, du client, les lignes de facturation, les taxes, les totaux et un PDF professionnel.",
          },
        },
        {
          "@type": "Question",
          name: "Peut-on télécharger les factures en PDF ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Oui. Les factures peuvent être prévisualisées puis téléchargées en PDF professionnel depuis l'application.",
          },
        },
        {
          "@type": "Question",
          name: "FacturaPro convient-il aux freelances et petites entreprises ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Oui. FacturaPro est pensé pour les indépendants, TPE et petites équipes qui veulent gérer leurs clients, factures et paiements dans un espace simple.",
          },
        },
      ],
    },
  ],
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Hero />
      <Features />
      <ProductPreview />
      <Pricing />
      <FAQ />
      <Trust />
      <About />
    </>
  )
}
