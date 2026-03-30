import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AppBackground } from "@/components/core/app-background";
import { PageTransition } from "@/components/core/page-transition";
import { CommandPalette } from "@/components/core/command-palette";
import { SmoothScroller } from "@/components/core/smooth-scroller";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "ELEV8.AI – AI Career Execution Engine",
  description:
    "We don't help you prepare — we help you get hired. AI-powered career execution system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <SmoothScroller>
              <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
                <AppBackground />
                <PageTransition>{children}</PageTransition>
                <CommandPalette />
                <Toaster richColors position="top-right" />
              </div>
            </SmoothScroller>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
