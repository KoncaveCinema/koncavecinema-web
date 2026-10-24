import { getCatalog } from "@/features/catalog/get-catalog";
import { lowestPrice, sortedShowtimes } from "@/features/catalog/screening";
import { ratingLabel } from "@/lib/format";
import { absoluteUrl, jsonLd, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

/**
 * JSON-LD for search engines: who we are (Organization, WebSite) and each film's next online
 * screening (ScreeningEvent with its Movie and starting price), all from catalog data.
 */
export async function HomeStructuredData() {
  const { films } = await getCatalog();
  const organization = {
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon.png"),
  };

  const screenings = films.flatMap((film) => {
    const next = sortedShowtimes(film)[0];
    if (!next) return [];
    const url = absoluteUrl(`/movies/${film.slug}/showtimes/${next.id}`);
    const price = lowestPrice([next]);
    return [
      {
        "@type": "ScreeningEvent",
        name: film.title,
        description: film.synopsis,
        url,
        image: absoluteUrl(film.posterLandscape),
        startDate: next.startTime,
        endDate: next.endTime,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
        location: { "@type": "VirtualLocation", url },
        organizer: { "@id": organization["@id"] },
        workPresented: {
          "@type": "Movie",
          name: film.title,
          description: film.synopsis,
          image: absoluteUrl(film.posterPortrait),
          duration: `PT${film.durationMinutes}M`,
          contentRating: `NFVCB ${ratingLabel(film.ageRating)}`,
          productionCompany: { "@type": "Organization", name: film.producerName },
        },
        ...(price && {
          offers: {
            "@type": "Offer",
            url,
            price: price.amount,
            priceCurrency: price.currency,
            availability: "https://schema.org/InStock",
          },
        }),
      },
    ];
  });

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        url: absoluteUrl("/"),
        publisher: { "@id": organization["@id"] },
        inLanguage: "en-NG",
      },
      ...screenings,
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Escaped by jsonLd(), so catalog text cannot break out of the script
      dangerouslySetInnerHTML={{ __html: jsonLd(graph) }}
    />
  );
}
