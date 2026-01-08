import './globals.css'
import { Noto_Serif_SC, Source_Serif_4, Inter } from 'next/font/google'
import { LanguageProvider } from '@/contexts/LanguageContext'
import MemoryBubble from '@/components/MemoryBubble'
import BackToTop from '@/components/BackToTop'

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
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh" suppressHydrationWarning className={`${notoSerifSC.variable} ${sourceSerif4.variable} ${inter.variable}`}>
      <body className="antialiased font-sans">
        <LanguageProvider>
          <div className="min-h-screen">
            <main>
              {children}
            </main>
          </div>
          <BackToTop />
          <MemoryBubble />
        </LanguageProvider>
      </body>
    </html>
  )
}
