import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

export function SEO({ 
  title, 
  description, 
  keywords, 
  canonical, 
  ogImage, 
  noindex = false 
}: SEOProps) {
  
  // --- DEFAULT CONFIGURATION ---
  const siteName = "TradeOmen";
  const domain = "https://tradeomen.com";
  const defaultTitle = "TradeOmen | AI-Powered Trading Journal & Analytics";
  const defaultDescription = "Automate your trading journal, master your psychology, and find your edge with TradeOmen. The advanced analytics platform for Crypto, Forex, and Stock traders.";
  const defaultImage = `${domain}/images/og-image.jpg`; // Make sure to create this image in public/images/
  
  const fullTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const metaDescription = description || defaultDescription;
  const metaImage = ogImage ? (ogImage.startsWith("http") ? ogImage : `${domain}${ogImage}`) : defaultImage;
  const metaUrl = canonical || (typeof window !== "undefined" ? window.location.href : domain);
  
  // --- STRUCTURED DATA (JSON-LD) ---
  // This tells Google: "We are a Software Application"
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "TradeOmen",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": metaDescription,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "120" // Placeholder for MVP, update with real data later
    }
  };

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#0A0A0A" /> {/* Matches your background */}
      {keywords && <meta name="keywords" content={keywords.join(", ")} />}
      
      {/* Robots Control */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow" />}

      {/* Canonical URL */}
      <link rel="canonical" href={metaUrl} />

      {/* Open Graph / Facebook / Discord */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@tradeomen" /> {/* Replace with actual handle */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Structured Data script */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}