import type { Metadata, Viewport } from 'next';
import { Nunito, Noto_Sans_Tamil, Noto_Sans_Malayalam, Noto_Sans_Kannada, Noto_Sans_Telugu } from 'next/font/google';
import { LangProvider } from '@/lib/lang';
import { Disclaimer, Footer, Header } from '@/components/Chrome';
import './globals.css';

const nunito = Nunito({ subsets: ['latin'], weight: ['500', '700', '800'], display: 'swap', variable: '--font-nunito' });
const notoTamil = Noto_Sans_Tamil({ subsets: ['tamil'], weight: ['500', '700'], display: 'swap', variable: '--font-tamil' });

const notoMalayalam = Noto_Sans_Malayalam({ subsets: ['malayalam'], weight: ['500', '700'], display: 'swap', variable: '--font-malayalam' });
const notoKannada = Noto_Sans_Kannada({ subsets: ['kannada'], weight: ['500', '700'], display: 'swap', variable: '--font-kannada' });
const notoTelugu = Noto_Sans_Telugu({ subsets: ['telugu'], weight: ['500', '700'], display: 'swap', variable: '--font-telugu' });

export const metadata: Metadata = {
  title: { default: 'India Schemes Guide', template: '%s | India Schemes Guide' },
  description:
    'Find government schemes, subsidies and concessions for MSMEs, farmers, home seekers, students and women, with the documents you need and the official link.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFF6E5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${notoTamil.variable} ${notoMalayalam.variable} ${notoKannada.variable} ${notoTelugu.variable}`}>
      <head>
        {/* On the welcome screen the page starts as black space, so nothing flashes before the globe is ready. */}
        <script dangerouslySetInnerHTML={{ __html: "try{if(location.pathname==='/')document.documentElement.classList.add('space')}catch(e){}" }} />
      </head>
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
