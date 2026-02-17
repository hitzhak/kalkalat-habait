import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { QuickAddButton } from "@/components/layout/QuickAddButton";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { PageTransition } from "@/components/layout/PageTransition";

const heebo = Heebo({ 
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0891B2",
};

export const metadata: Metadata = {
  title: "כלכלת הבית",
  description: "ניהול תקציב משפחתי",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "כלכלת הבית",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} bg-slate-50`}>
      <body className={heebo.className}>
        {/* סרגל התקדמות עליון */}
        <NavigationProgress />

        <div className="flex min-h-screen bg-slate-50">
          {/* Sidebar - Desktop only */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex flex-1 flex-col md:mr-60">
            {/* Header with month selector */}
            <Header />

            {/* Page content with smooth transitions */}
            <main className="flex-1 pb-20 md:pb-6 overflow-x-hidden">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileNav />

        {/* Quick Add Button (FAB) */}
        <QuickAddButton />

        {/* Toast notifications */}
        <Toaster />
        <Sonner />
      </body>
    </html>
  );
}
