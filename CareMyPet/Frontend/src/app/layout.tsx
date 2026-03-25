import type { Metadata } from "next";
import { Suspense } from "react";
// import "./globals.css";
import "../styles/globals.css";
import { AppProviders } from "@/context/AppProviders";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { BottomNav } from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: {
    default: "CareMyPet",
    template: "%s | CareMyPet"
  },
  description: "CareMyPet – Pet Accessories & Healthcare Platform",
  icons: {
    icon: "/brand/favicon.svg",
    shortcut: "/brand/favicon.svg",
    apple: "/brand/logo.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Suspense fallback={<div />}>
          <AppProviders>
            <ToastProvider />
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 pb-16 md:pb-0">{children}</main>
              <Footer />
            </div>
            <ChatWidget />
            <BottomNav />
          </AppProviders>
        </Suspense>
      </body>
    </html>
  );
}

