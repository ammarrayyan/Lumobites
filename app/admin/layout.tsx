import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | Lumo Bites",
  other: {
    'darkreader-lock': 'true',
  },
};

export const viewport: Viewport = {
  colorScheme: 'dark',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
