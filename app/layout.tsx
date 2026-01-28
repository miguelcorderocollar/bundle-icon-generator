import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/src/components/ThemeProvider";
import { RestrictionProvider } from "@/src/contexts/RestrictionContext";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "App Icon Generator",
    template: "%s | App Icon Generator",
  },
  description:
    "Generate icon bundles for any platform. A local-first tool for crafting app icons with customizable colors, effects, and one-click export.",
  keywords: [
    "app icon",
    "icon generator",
    "icon bundle",
    "Zendesk Garden",
    "Feather icons",
    "icon export",
    "RemixIcon",
    "SVG icons",
    "developer tools",
  ],
  authors: [
    {
      name: "Miguel Cordero Collar",
      url: "https://github.com/miguelcorderocollar",
    },
  ],
  creator: "Miguel Cordero Collar",
  publisher: "Miguel Cordero Collar",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ),
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  referrer: "origin-when-cross-origin",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    title: "App Icon Generator",
    description:
      "Generate icon bundles for any platform. A local-first tool for crafting app icons with customizable colors, effects, and one-click export.",
    siteName: "App Icon Generator",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "App Icon Generator",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "App Icon Generator",
    description:
      "Generate icon bundles for any platform. A local-first tool for crafting app icons.",
    creator: "@miguelcorderocollar",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "android-chrome-512x512",
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "developer tools",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#063940" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "App Icon Generator",
    description:
      "Generate icon bundles for any platform. A local-first tool for crafting app icons with customizable colors, effects, and one-click export.",
    url: baseUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Miguel Cordero Collar",
      url: "https://github.com/miguelcorderocollar",
    },
    publisher: {
      "@type": "Person",
      name: "Miguel Cordero Collar",
    },
    inLanguage: "en-US",
    browserRequirements: "Requires JavaScript. Modern web browser required.",
    featureList: [
      "App icon generation for multiple platforms",
      "Multiple icon packs (Garden, Feather, RemixIcon, Emoji)",
      "Custom SVG and image upload",
      "Color customization with gradients",
      "One-click ZIP export",
      "Local-first, privacy-focused",
    ],
    screenshot: `${baseUrl}/logo.png`,
    image: `${baseUrl}/logo.png`,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('theme');
                let theme = stored;
                if (!theme) {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.add(theme);
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <RestrictionProvider>{children}</RestrictionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
