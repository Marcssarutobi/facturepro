"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm"
          : "bg-background"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/logoFacture.png" alt="Logo FacturaPro" width="150" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#fonctionnalites"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Fonctionnalités
          </Link>
          <Link
            href="#tarifs"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Tarifs
          </Link>
          <Link
            href="#apropos"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            À propos
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="outline" asChild>
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Démarrer gratuitement</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link
              href="#fonctionnalites"
              className="text-sm font-medium text-muted-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Fonctionnalités
            </Link>
            <Link
              href="#tarifs"
              className="text-sm font-medium text-muted-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tarifs
            </Link>
            <Link
              href="#apropos"
              className="text-sm font-medium text-muted-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              À propos
            </Link>
            <hr className="my-2" />
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard">Se connecter</Link>
            </Button>
            <Button className="w-full" asChild>
              <Link href="/dashboard">Démarrer gratuitement</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
