import Link from "next/link"

const footerLinks = {
  produit: [
    { name: "Fonctionnalités", href: "#fonctionnalites" },
    { name: "Aperçu", href: "#demo" },
    { name: "Tarifs", href: "#tarifs" },
    { name: "FAQ", href: "#faq" },
  ],
  entreprise: [
    { name: "À propos", href: "#apropos" },
    { name: "Support", href: "#support" },
    { name: "Politique de confidentialité", href: "#confidentialite" },
  ],
  contact: [
    { name: "contact@facturapro.com", href: "mailto:contact@facturapro.com" },
    { name: "Se connecter", href: "/login" },
    { name: "Créer un compte", href: "/register" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logoFacture.png" alt="Logo FacturaPro" width="150" />
            </Link>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              La solution SaaS pour créer, suivre et télécharger vos factures professionnelles.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Produit</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.produit.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Entreprise</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.entreprise.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Contact</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.contact.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} FacturaPro. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
