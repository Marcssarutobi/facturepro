import Link from "next/link"

const footerLinks = {
  produit: [
    { name: "Fonctionnalités", href: "#fonctionnalites" },
    { name: "Tarifs", href: "#tarifs" },
    { name: "Démo", href: "#demo" },
  ],
  legal: [
    { name: "Mentions légales", href: "#" },
    { name: "CGV", href: "#" },
    { name: "Politique de confidentialité", href: "#" },
  ],
  contact: [
    { name: "Support", href: "#" },
    { name: "contact@facturapro.com", href: "mailto:contact@facturapro.com" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">F</span>
              </div>
              <span className="text-xl font-bold text-foreground">FacturaPro</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              La solution de facturation simple et efficace pour les professionnels indépendants.
            </p>
          </div>

          {/* Produit */}
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

          {/* Légal */}
          <div>
            <h3 className="font-semibold text-foreground">Légal</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
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

          {/* Contact */}
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

        {/* Copyright */}
        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} FacturaPro. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
