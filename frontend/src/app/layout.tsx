import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/theme-provider";
import { Navbar } from "@/components/Navbar";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "НавИГРАтор — платформа для развития навыков через игры",
  description: "MBTI-тест, каталог игр, помощники-наставники. Развивай навыки, отслеживай прогресс, играй с друзьями!",
  keywords: "навигратор, mbti, тест личности, игры, развитие навыков, наставник",
  openGraph: {
    title: "НавИГРАтор — платформа для развития навыков",
    description: "Пройди MBTI-тест, играй в игры и развивай навыки с наставником",
    url: "https://navigrator.vercel.app",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="yandex-verification" content="2564abf5ab918f74" />
      </head>
      <body className="bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}