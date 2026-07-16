import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import PwaRegister from "@/components/PwaRegister";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import PwaSplashScreen from "@/components/PwaSplashScreen";
import FloatingQRCode from "@/components/FloatingQRCode";
import PushManager from "@/components/PushManager";
import MobileBottomNav from "@/components/MobileBottomNav";
import TermsModal from "@/components/TermsModal";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const proEmail = cookieStore.get('lumo_pro_email')?.value || '';

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
      <body className={inter.className} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <TermsModal />
        <PwaRegister />
        <PushManager />
        <PwaSplashScreen />
        <PwaInstallBanner />
        <Navbar initialEmail={proEmail} />
        <div className="pt-[72px] pb-24 lg:pb-0 min-h-[calc(100dvh-72px)] flex flex-col justify-between">
          <div className="flex-grow">
            {children}
          </div>
          <footer className="w-full bg-[#FAF6F4] border-t border-[#E8DDD4] py-6 px-4 text-center text-xs text-[#8B7E7D] mt-12">
            <p>© {new Date().getFullYear()} Lumo Bites. All rights reserved.</p>
            <p className="mt-1 font-semibold text-[#8B5E3C]">
              Report inappropriate content: <a href="mailto:info@lumobitespet.com" className="underline hover:text-[#734A2E]">info@lumobitespet.com</a>
            </p>
            <div className="flex gap-4 items-center justify-center flex-wrap mt-3">
              <a href="/privacy" className="text-xs text-gray-400 hover:text-[#8B5E3C]">
                Privacy Policy
              </a>
              <a href="/terms" className="text-xs text-gray-400 hover:text-[#8B5E3C]">
                Terms of Service
              </a>
              <a href="/partnerships" className="text-xs text-gray-400 hover:text-[#8B5E3C]">
                Partnerships & Press
              </a>
            </div>
          </footer>
        </div>
        <MobileBottomNav />
        <FloatingQRCode />
      </body>
    </html>
  );
}

