const faqs = [
  {
    question: "FacturaPro permet-il de générer une facture de vente normalisée ?",
    answer:
      "Oui. FacturaPro aide à créer des factures de vente normalisées avec les informations de l'entreprise, du client, les lignes de facturation, les taxes, les totaux et un PDF professionnel.",
  },
  {
    question: "Peut-on télécharger les factures en PDF ?",
    answer:
      "Oui. Les factures peuvent être prévisualisées puis téléchargées en PDF professionnel depuis l'application.",
  },
  {
    question: "FacturaPro convient-il aux freelances et petites entreprises ?",
    answer:
      "Oui. FacturaPro est pensé pour les indépendants, TPE et petites équipes qui veulent gérer leurs clients, factures et paiements dans un espace simple.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Questions fréquentes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Les réponses essentielles avant de choisir votre logiciel de facturation.
          </p>
        </div>

        <div className="mt-10 divide-y rounded-lg border bg-card">
          {faqs.map((faq) => (
            <details key={faq.question} className="group px-5 py-4 open:bg-muted/30">
              <summary className="cursor-pointer list-none font-semibold text-foreground">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
