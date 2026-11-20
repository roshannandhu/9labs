import { site } from "@/content/site";

/** Structured data for search engines (Organization + ProfessionalService + the nine services + e-books). */
export function buildJsonLd() {
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
        slogan: "The bridge between your business and your results.",
        priceRange: "$$",
        email: site.contact.email,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Dubai South",
          addressRegion: "Dubai",
          addressCountry: "AE",
        },
        geo: { "@type": "GeoCoordinates", latitude: 24.89, longitude: 55.16 },
        areaServed: ["Dubai", "United Arab Emirates", "GCC"],
        knowsAbout: [
          ...site.services.map((s) => s.title),
          "Digital Marketing Dubai",
          "Social Media Marketing UAE",
          "Paid Advertising & PPC",
          "Commercial Video Production",
          "Corporate Event Management",
          "Trade Shows & Exhibitions",
          "Public Relations Dubai",
          "Marketing Strategy Consultancy",
          "AI Business Automation",
          "Enterprise IT Consultancy",
        ],
        keywords:
          "9labs, 9 labs, 9labs Dubai, Nine Labs Solutions, marketing agency Dubai, digital marketing UAE, event management Dubai, AI consultancy UAE, IT consultancy Dubai South",
        sameAs: site.socials.map((s) => s.href).filter((h) => h.startsWith("http")),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: site.contact.email,
          availableLanguage: ["English", "Arabic"],
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Nine activities",
          itemListElement: site.services.map((s) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: s.title,
              description: s.description,
              keywords: s.tags.join(", "),
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
