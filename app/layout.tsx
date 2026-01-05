import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/src/components/ThemeProvider";
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
    default: "Zendesk App Icon Generator",
    template: "%s | Zendesk App Icon Generator",
  },
  description:
    "Generate compliant Zendesk app icon bundles. A local-first tool for crafting Zendesk app icons with customizable colors, effects, and one-click export.",
  keywords: [
    "Zendesk",
    "app icon",
    "icon generator",
    "Zendesk app",
    "icon bundle",
    "Zendesk Garden",
    "Feather icons",
    "icon export",
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
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Zendesk App Icon Generator",
    description:
      "Generate compliant Zendesk app icon bundles. A local-first tool for crafting Zendesk app icons with customizable colors, effects, and one-click export.",
    siteName: "Zendesk App Icon Generator",
    images: [
      {
        url: "/logo.png",
        width: 320,
        height: 320,
        alt: "Zendesk App Icon Generator Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zendesk App Icon Generator",
    description:
      "Generate compliant Zendesk app icon bundles. A local-first tool for crafting Zendesk app icons.",
    images: ["/logo.png"],
    creator: "@miguelcorderocollar",
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
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
