import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { ProductPreview } from "@/components/landing/product-preview"
import { Pricing } from "@/components/landing/pricing"
import { Testimonials } from "@/components/landing/testimonials"

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <ProductPreview />
      <Pricing />
      <Testimonials />
    </>
  )
}
