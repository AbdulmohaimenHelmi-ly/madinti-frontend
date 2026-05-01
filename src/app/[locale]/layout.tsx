import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { SignJWT } from "jose";
import { routing } from "@/i18n/routing";
import ThemeRegistry from "@/components/providers/ThemeRegistry";

const _secret = new TextEncoder().encode(
  process.env.PROXY_JWT_SECRET ||
    "dev-only-secret-please-set-PROXY_JWT_SECRET-in-production"
);

async function buildInitUrl(): Promise<string> {
  // Sign a one-time nonce into a JWT and use it as the URL path.
  // The /api/[token] route handler validates this JWT.
  // Every page load produces a completely different URL — there is no
  // fixed /api/init endpoint for scanners to discover.
  const nonce = crypto.randomUUID();
  const token = await new SignJWT({ n: nonce })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90s")
    .sign(_secret);
  return `/api/${token}`;
}
import AuthInitializer from "@/components/providers/AuthInitializer";
import ImpersonationBanner from "@/components/layout/ImpersonationBanner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { ContentFilterProvider } from "@/lib/context/ContentFilterContext";
import DevToolsGuard from "@/components/DevToolsGuard";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "مياو - سوق إلكتروني" : "Meow - Marketplace",
    description:
      locale === "ar"
        ? "أفضل المنتجات من أفضل المتاجر"
        : "The best products from the best stores",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "ar" | "en")) {
    notFound();
  }
  const messages = await getMessages();
  const direction = locale === "ar" ? "rtl" : "ltr";
  const initUrl = await buildInitUrl();

  return (
    <html lang={locale} dir={direction}>
      <head>
        {/* Random one-time init URL — different every page load.
            The URL itself is a signed JWT; no fixed /api/init exists. */}
        <meta name="x-i" content={initUrl} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: "#F5F7FA" }}>
        <NextIntlClientProvider messages={messages}>
          <ContentFilterProvider>
            <ThemeRegistry>
              <DevToolsGuard locale={locale} />
              <AuthInitializer />
              <ImpersonationBanner />
              <Header />
              <main
                style={{ minHeight: "80vh" }}
                className="app-main-content"
              >
                {children}
              </main>
              <Footer />
              <MobileBottomNav />
            </ThemeRegistry>
          </ContentFilterProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
