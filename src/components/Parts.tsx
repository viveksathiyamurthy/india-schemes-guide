'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useLang } from '@/lib/lang';
import { ui } from '@/lib/ui';
import { parseBlocks } from '@/lib/text';
import type { Scheme } from '@/data/types';
import { states } from '@/data/config';

/** Search box. A plain GET form, so it works even before the page scripts load. */
export function SearchBar({ stateSlug, defaultValue = '' }: { stateSlug?: string; defaultValue?: string }) {
  const { t } = useLang();
  return (
    <form className="srch" action="/search" method="get" role="search">
      {stateSlug ? <input type="hidden" name="state" value={stateSlug} /> : null}
      <input
        className="inp"
        type="search"
        name="q"
        defaultValue={defaultValue}
        aria-label={t(ui.searchLabel)}
        placeholder={stateSlug ? t(ui.searchPlaceholderState) : t(ui.searchPlaceholder)}
      />
      <button className="go" type="submit">
        {t(ui.searchButton)}
      </button>
    </form>
  );
}

export function BackButton({ fallbackHref = '/', children }: { fallbackHref?: string; children?: ReactNode }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      className="back"
      onClick={() => {
        if (window.history.length > 1) window.history.back();
        else window.location.href = fallbackHref;
      }}
    >
      &larr; {children ?? t(ui.back)}
    </button>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="back">
      &larr; {children}
    </Link>
  );
}

export function LevelTag({ scheme }: { scheme: Scheme }) {
  const { t } = useLang();
  const union = scheme.level === 'Union/Central Government';
  return <span className={union ? 'tag u' : 'tag s'}>{union ? t(ui.unionGov) : t(ui.stateGov)}</span>;
}

export function PlaceTag({ scheme }: { scheme: Scheme }) {
  const { t, tr } = useLang();
  const label = scheme.state === 'All India' ? t(ui.allIndia) : tr(scheme.state, stateTa(scheme.state));
  return <span className="tag p">{label}</span>;
}

export function stateTa(name: string): string | undefined {
  return states.find((s) => s.name === name)?.nameTa;
}

export function SchemeCard({ scheme, showPlace = false }: { scheme: Scheme; showPlace?: boolean }) {
  const { tr } = useLang();
  return (
    <Link href={`/scheme/${scheme.slug}`} className="card">
      <span className="tags">
        <LevelTag scheme={scheme} />
        {showPlace ? <PlaceTag scheme={scheme} /> : null}
      </span>
      <b>{tr(scheme.shortName, scheme.nameTa)}</b>
      <span className="d">{tr(scheme.summaryEn, scheme.summaryTa)}</span>
    </Link>
  );
}

/** Shows sheet text as paragraphs, bullet lists and numbered lists. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {parseBlocks(text).map((block, i) => {
        if (block.type === 'p') return <p key={i}>{block.text}</p>;
        const Tag = block.type;
        return (
          <Tag key={i}>
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </Tag>
        );
      })}
    </>
  );
}
