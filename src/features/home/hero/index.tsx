import { getCatalog } from "@/features/catalog/get-catalog";
import { HeroStage } from "@/components/cinema/hero-stage";

import { HeroCarousel } from "./carousel";
import { EmptyHero, FeaturedSlide } from "./slides";

const FEATURED_COUNT = 3;

export async function Hero() {
  const { films } = await getCatalog();
  // The API lists them soonest screening first: films playing or about to play lead the billboard
  const featured = films.slice(0, FEATURED_COUNT);

  if (featured.length === 0) return <EmptyHero />;

  return (
    <HeroCarousel
      labels={featured.map((film) => film.title)}
      slides={featured.map((film, index) => (
        <FeaturedSlide key={film.id} film={film} priority={index === 0} />
      ))}
    />
  );
}

/** Same footprint as the hero, so streaming it in causes no layout shift. */
export function HeroSkeleton() {
  return (
    <HeroStage priority={false}>
      <div className="max-w-xl space-y-6">
        <div className="h-7 w-40 animate-pulse rounded-full bg-white/10" />
        <div className="h-28 w-full animate-pulse rounded-2xl bg-white/10" />
        <div className="h-5 w-3/4 animate-pulse rounded-full bg-white/10" />
        <div className="h-12 w-64 animate-pulse rounded-full bg-white/10" />
      </div>
    </HeroStage>
  );
}
