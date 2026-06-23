import { AuthProvider } from "@/components/providers/AuthProvider";
import { AppProvider } from "@/context/AppContext";
import AppLayout from "@/components/AppLayout";
import "./globals.css";

export const metadata = {
  title: {
    default: "Durbar | Global Nepali Marketplace",
    template: "%s | Durbar"
  },
  description: "Discover premium Nepali garments, luxury pashminas, and authentic organic food. A global marketplace bridging Kathmandu to London and beyond.",
  keywords: ["Nepali marketplace", "Pashmina", "Kathmandu to UK", "authentic Nepali food", "luxury ethnic wear", "Durbar marketplace"],
  openGraph: {
    title: "Durbar | Premium Global Nepali Marketplace",
    description: "Discover premium Nepali garments, luxury pashminas, and authentic organic food.",
    url: "https://durbar-marketplace.vercel.app",
    siteName: "Durbar Marketplace",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      }
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Durbar | Premium Global Nepali Marketplace",
    description: "Discover premium Nepali garments, luxury pashminas, and authentic organic food.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          <AppProvider>
            <AppLayout>{children}</AppLayout>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
