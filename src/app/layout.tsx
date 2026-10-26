import type { Metadata, Viewport } from 'next';
import { Nunito, Noto_Sans_Tamil } from 'next/font/google';
import { LangProvider } from '@/lib/lang';
import { Disclaimer, Footer, Header } from '@/components/Chrome';
import './globals.css';

const nunito = Nunito({ subsets: ['latin'], weight: ['500', '700', '800'], display: 'swap', variable: '--font-nunito' });
const notoTamil = Noto_Sans_Tamil({ subsets: ['tamil'], weight: ['500', '700'], display: 'swap', variable: '--font-tamil' });

export const metadata: Metadata = {
  title: { default: 'India Schemes Guide', template: '%s | India Schemes Guide' },
  description:
    'Find government schemes, subsidies and concessions for MSMEs, farmers, home seekers, students and women, with the documents you need and the official link.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FF9398',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${notoTamil.variable}`}>
      <body>
        <LangProvider>
          <div className="app">
            <Header />
            <Disclaimer />
            <main>{children}</main>
            <Footer />
          </div>
        </LangProvider>
      </body>
    </html>
  );
}
