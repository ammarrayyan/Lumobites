import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import PwaRegister from "@/components/PwaRegister";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import PwaSplashScreen from "@/components/PwaSplashScreen";
import FloatingQRCode from "@/components/FloatingQRCode";
import PushManager from "@/components/PushManager";
import MobileBottomNav from "@/components/MobileBottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lumo Bites - Pet Care, Sitting, Food & More | lumobites.net",
  description: "Find trusted pet sitters, scan pet food ingredients, get FDA recall alerts, discover your Pet Twin and more. Free to join.",
  manifest: "/manifest.json",
  icons: {
    icon: "/Logo.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Lumo Bites - Pet Care, Sitting, Food & More | lumobites.net",
    description: "Find trusted pet sitters, scan pet food ingredients, get FDA recall alerts, discover your Pet Twin and more. Free to join.",
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
    title: "Lumo Bites - Pet Care, Sitting, Food & More | lumobites.net",
    description: "Find trusted pet sitters, scan pet food ingredients, get FDA recall alerts, discover your Pet Twin and more. Free to join.",
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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lumo Bites" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
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
      <body className={inter.className}>
        <PwaRegister />
        <PushManager />
        <PwaSplashScreen />
        <PwaInstallBanner />
        <div className="pt-[72px] pb-24 md:pb-0">
          {children}
        </div>
        <MobileBottomNav />
        <FloatingQRCode />
      </body>
    </html>
  );
}

