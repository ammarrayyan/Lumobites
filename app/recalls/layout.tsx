import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "FDA Pet Food Recall Checker | Lumo Bites",
  description: "Check if your pet's food has an active FDA recall right now — free and instant",
  openGraph: {
    title: "FDA Pet Food Recall Checker | Lumo Bites",
    description: "Check if your pet's food has an active FDA recall right now — free and instant",
    url: "https://lumobites.net/recalls",
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
    title: "FDA Pet Food Recall Checker | Lumo Bites",
    description: "Check if your pet's food has an active FDA recall right now — free and instant",
    images: ["https://lumobites.net/og-image.png"],
  }
};

export default function RecallsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
