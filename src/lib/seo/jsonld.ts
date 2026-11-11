import type { SiteData } from "@/content/types";

/** Structured data for search engines (Organization + ProfessionalService + the nine services + e-books). */
export function buildJsonLd(site: SiteData) {
  const orgId = `${site.url}/#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": orgId,
        name: site.name,
        url: site.url,
        description: site.hero.sub,
        slogan: site.about.statement,
        email: site.contact.email,
        address: {
          "@type": "PostalAddress",
          addressLocality: site.geo.locality,
          addressRegion: site.geo.region,
          addressCountry: site.geo.country,
        },
        geo: { "@type": "GeoCoordinates", latitude: site.geo.latitude, longitude: site.geo.longitude },
        areaServed: ["Dubai", "United Arab Emirates", "GCC"],
        knowsAbout: site.services.map((s) => s.title),
        sameAs: site.socials.map((s) => s.href).filter((h) => h.startsWith("http")),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Nine activities",
          itemListElement: site.services.map((s) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: s.title,
              description: s.description,
              provider: { "@id": orgId },
              areaServed: "AE",
            },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        publisher: { "@id": orgId },
        inLanguage: "en",
      },
      ...site.ebooks.map((b) => ({
        "@type": "Book",
        name: b.title,
        alternativeHeadline: b.subtitle,
        description: b.oneLiner,
        bookFormat: "https://schema.org/EBook",
        numberOfPages: b.pages,
        isAccessibleForFree: true,
        author: { "@id": orgId },
        publisher: { "@id": orgId },
      })),
    ],
  };
}
