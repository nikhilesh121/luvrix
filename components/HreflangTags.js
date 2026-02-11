import Head from "next/head";
import { useRouter } from "next/router";

const supportedLocales = ["en", "es", "ja"];
const defaultLocale = "en";

export default function HreflangTags({ baseUrl = "https://luvrix.com" }) {
  const router = useRouter();
  const currentPath = router.asPath.split("?")[0];

  return (
    <Head>
      {/* Canonical URL */}
      <link rel="canonical" href={`${baseUrl}${currentPath}`} />

      {/* hreflang tags for each supported locale */}
      {supportedLocales.map((locale) => (
        <link
          key={locale}
          rel="alternate"
          hrefLang={locale}
          href={`${baseUrl}/${locale}${currentPath}`}
        />
      ))}

      {/* x-default for language selection page / default */}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${baseUrl}${currentPath}`}
      />

      {/* Open Graph locale tags */}
      <meta property="og:locale" content={router.locale || defaultLocale} />
      {supportedLocales
        .filter((locale) => locale !== (router.locale || defaultLocale))
        .map((locale) => (
          <meta
            key={`og-${locale}`}
            property="og:locale:alternate"
            content={locale}
          />
        ))}
    </Head>
  );
}

export function generateHreflangLinks(path, baseUrl = "https://luvrix.com") {
  return supportedLocales.map((locale) => ({
    locale,
    url: `${baseUrl}/${locale}${path}`,
  }));
}

export { supportedLocales, defaultLocale };
