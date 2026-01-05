import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  type?: "website" | "article";
  name?: string;
  image?: string;
}

export function SEO({ 
  title, 
  description, 
  canonical, 
  type = "website",
  name = "TradeOmen",
  image = "/og-image.png" // Make sure to add an Open Graph image to your public folder
}: SEOProps) {
  const siteUrl = "https://tradeomen.com"; // Replace with your actual domain
  const fullUrl = canonical ? canonical : siteUrl;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title} | TradeOmen</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${image}`} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={name} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${image}`} />
    </Helmet>
  );
}