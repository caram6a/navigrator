import "@/styles/globals.css";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/lib/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "НавИГРАтор — платформа для развития навыков через игры",
  description: "MBTI-тест, каталог игр, помощники-наставники. Развивай навыки, отслеживай прогресс, играй с друзьями!",
  keywords: "навигратор, mbti, тест личности, игры, развитие навыков, наставник",
  openGraph: {
    title: "НавИГРАтор — платформа для развития навыков",
    description: "Пройди MBTI-тест, играй в игры и развивай навыки с наставником",
    type: "website",
    url: "https://navigrator.vercel.app",
  },
  verification: {
    yandex: "ваш_код_подтверждения",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="yandex-verification" content="ваш_код_подтверждения" />
      </head>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
