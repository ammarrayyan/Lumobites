import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Find the Best Food for Your Pet | Lumo Bites",
  description: "Free tools for pet owners — scan ingredients, check FDA recalls, find your pet twin and discover the best food for your pet",
  icons: {
    icon: "/Logo.png",
  },
  openGraph: {
    title: "Find the Best Food for Your Pet | Lumo Bites",
    description: "Free tools for pet owners — scan ingredients, check FDA recalls, find your pet twin and discover the best food for your pet",
    url: "https://lumobites.net",
    images: [
      {
        url: "https://lumobites.net/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lumo Bites",
      }
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find the Best Food for Your Pet | Lumo Bites",
    description: "Free tools for pet owners — scan ingredients, check FDA recalls, find your pet twin and discover the best food for your pet",
    images: ["https://lumobites.net/og-image.png"],
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MNH8TBZHHR"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MNH8TBZHHR');
          `}
        </Script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
