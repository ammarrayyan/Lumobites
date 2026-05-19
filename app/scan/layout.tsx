import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Is This Pet Food Safe? | Lumo Bites",
  description: "Scan your pet food ingredients instantly and find out if anything harmful is hiding in the label",
  openGraph: {
    title: "Is This Pet Food Safe? | Lumo Bites",
    description: "Scan your pet food ingredients instantly and find out if anything harmful is hiding in the label",
    url: "https://lumobites.net/scan",
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
    title: "Is This Pet Food Safe? | Lumo Bites",
    description: "Scan your pet food ingredients instantly and find out if anything harmful is hiding in the label",
    images: ["https://lumobites.net/og-image.png"],
  }
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
