import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* When this leaves the viewport the header turns to frosted glass */}
      <div id="top-sentinel" aria-hidden="true" className="absolute top-0 h-px w-px" />
      <a
        href="#main"
        className="sr-only z-60 rounded-full bg-brand px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
