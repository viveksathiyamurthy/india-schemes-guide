'use client';

import Link from 'next/link';
import { useLang } from '@/lib/lang';
import { ui } from '@/lib/ui';

export function BrandMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <polygon points="2,14 26,3 18,25" fill="#E4572E" />
      <polygon points="2,14 18,25 13,16" fill="#2a2230" />
    </svg>
  );
}

export function Header() {
  const { lang, setLang, t } = useLang();
  return (
    <header className="top">
      <Link href="/" className="brand">
        <BrandMark />
        <span>{t(ui.brand)}</span>
      </Link>
      <div className="lang" role="group" aria-label="Language">
        <button type="button" className={lang === 'ta' ? 'on' : ''} aria-pressed={lang === 'ta'} onClick={() => setLang('ta')} lang="ta">
          தமிழ்
        </button>
        <button type="button" className={lang === 'en' ? 'on' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
          EN
        </button>
      </div>
    </header>
  );
}

export function Disclaimer() {
  const { t } = useLang();
  return (
    <div className="strip" role="note">
      {t(ui.disclaimer)}
    </div>
  );
}

export function Footer() {
  const { t } = useLang();
  return <footer className="foot-note">{t(ui.footer)}</footer>;
}
