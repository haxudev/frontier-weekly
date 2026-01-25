import './globals.css'
import { Noto_Serif_SC, Source_Serif_4, Inter } from 'next/font/google'
import { LanguageProvider } from '@/contexts/LanguageContext'
import MemoryBubble from '@/components/MemoryBubble'
import BackToTop from '@/components/BackToTop'
import Header from '@/components/Header'
import { ThemeProvider } from '@/components/ThemeProvider'
import { siteConfig } from '@/lib/siteConfig'

const notoSerifSC = Noto_Serif_SC({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
  fallback: ['Songti SC', 'STSong', 'SimSun', 'Hiragino Mincho ProN', 'serif'],
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
})

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif-en',
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
})

export const metadata = {
  title: '前沿今辰观',
  description: '无噪声前沿趋势发现与科技干货洞察',
  icons: {
    icon: '/icon.jpg',
    shortcut: '/icon.jpg',
    apple: '/icon.jpg',
  },
  // 默认 Open Graph 配置
  openGraph: {
    title: '前沿今辰观',
    description: '无噪声前沿趋势发现与科技干货洞察',
    url: siteConfig.url,
    siteName: '前沿今辰观',
    type: 'website',
    locale: 'zh_CN',
    images: [
      {
        url: `${siteConfig.url}/api/og?title=${encodeURIComponent('前沿今辰观')}&lang=zh`,
        width: 1200,
        height: 630,
        alt: '前沿今辰观',
      },
    ],
  },
  // 默认 Twitter Card 配置
  twitter: {
    card: 'summary_large_image',
    title: '前沿今辰观',
    description: '无噪声前沿趋势发现与科技干货洞察',
    images: [`${siteConfig.url}/api/og?title=${encodeURIComponent('前沿今辰观')}&lang=zh`],
  },
  // 其他 meta
  metadataBase: new URL(siteConfig.url),
  authors: [{ name: siteConfig.author.name }],
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh" suppressHydrationWarning className={`${notoSerifSC.variable} ${sourceSerif4.variable} ${inter.variable}`}>
      <body className="antialiased font-sans">
        <ThemeProvider>
          <LanguageProvider>
            <div className="min-h-screen">
              <Header />
              <main>
                {children}
              </main>
            </div>
            <BackToTop />
            <MemoryBubble />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
