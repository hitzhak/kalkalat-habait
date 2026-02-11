import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { QuickAddButton } from "@/components/layout/QuickAddButton";

const heebo = Heebo({ 
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "כלכלת הבית",
  description: "ניהול תקציב משפחתי",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className={heebo.className}>
        <div className="flex min-h-screen bg-slate-50">
          {/* Sidebar - Desktop only */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex flex-1 flex-col md:mr-60">
            {/* Header with month selector */}
            <Header />

            {/* Page content */}
            <main className="flex-1 pb-20 md:pb-6">
              {children}
            </main>
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileNav />

        {/* Quick Add Button (FAB) */}
        <QuickAddButton />

        {/* Toast notifications */}
        <Toaster />
      </body>
    </html>
  );
}
