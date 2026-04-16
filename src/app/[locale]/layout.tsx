import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import ThemeRegistry from "@/components/providers/ThemeRegistry";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
    title: locale === "ar" ? "أجمل - سوق إلكتروني" : "Ajjmal - Marketplace",
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

  return (
    <html lang={locale} dir={direction}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: "#F5F7FA" }}>
        <NextIntlClientProvider messages={messages}>
          <ThemeRegistry>
            <Header />
            <main style={{ minHeight: "80vh" }}>{children}</main>
            <Footer />
          </ThemeRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
