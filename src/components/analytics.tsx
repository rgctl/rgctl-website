import Script from "next/script";

const DEFAULT_GA_ID = "G-8WJX68J872";

/** Google tag (gtag.js) for GA4. Defaults to G-8WJX68J872; override via NEXT_PUBLIC_GA_MEASUREMENT_ID. */
export function Analytics() {
  const gaId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || DEFAULT_GA_ID;
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
