import type { Metadata } from "next";
import { Inter, Poppins, Roboto } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider"
import { TransitionProvider } from "@/components/transition-provider";
import { Toaster } from "@/components/ui/sonner";
import { MaintenanceListener } from "@/components/system/MaintenanceListener";
import { ThemeSync } from "@/components/system/ThemeSync";
import { OfflineIndicator } from "@/components/ui/offline-indicator";

import { SplashScreen } from "@/components/ui/splash-screen";

import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "PubConv",
  description: "Real-time communication for everyone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          poppins.variable,
          roboto.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <OfflineIndicator />
          <TransitionProvider>
            <ThemeSync />
            {children}
            <Toaster position="top-center" toastOptions={{ className: "mt-[calc(env(safe-area-inset-top)+10px)]" }} />
            <MaintenanceListener />
          </TransitionProvider>
          <SplashScreen />
        </ThemeProvider>
      </body>
    </html>
  );
}

