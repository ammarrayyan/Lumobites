import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Find Your Pet Twin Free | Lumo Bites",
  description: "Upload your selfie and discover which dog or cat breed you most resemble — free, instant, no sign up",
  openGraph: {
    title: "Find Your Pet Twin Free | Lumo Bites",
    description: "Upload your selfie and discover which dog or cat breed you most resemble — free, instant, no sign up",
    url: "https://lumobites.net/twin",
    images: [
      {
        url: "https://lumobites.net/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lumo Bites Logo",
      }
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Your Pet Twin Free | Lumo Bites",
    description: "Upload your selfie and discover which dog or cat breed you most resemble — free, instant, no sign up",
    images: ["https://lumobites.net/og-image.png"],
  }
};

export default function TwinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
