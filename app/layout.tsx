import type { Metadata } from "next";
import { Inter, Space_Grotesk, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { KriyaModeProvider } from "@/contexts/kriya-mode-context";
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

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "KRIYA — Decision & Execution OS",
  description:
    "A cinematic, philosophy-driven execution operating system. AI-powered career intelligence, strategic decision-making, and guided action.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-kriya-mode="vishnu" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${cormorant.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <KriyaModeProvider>
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
          </KriyaModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
