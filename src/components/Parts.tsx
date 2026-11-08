'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useLang } from '@/lib/lang';
import { ui } from '@/lib/ui';
import { parseBlocks } from '@/lib/text';
import { searchPersonas, searchSchemeNames, searchStates } from '@/lib/search';
import type { Scheme } from '@/data/types';
import { states, type StateInfo } from '@/data/config';

/** The search field and button. Each screen decides what it searches. */
function SearchBox({
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  action,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  action?: string;
}) {
  const { t } = useLang();
  return (
    <form className="srch" action={action} method="get" role="search" onSubmit={onSubmit}>
      <input
        className="inp"
        type="search"
        name="q"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        placeholder={placeholder}
        autoComplete="off"
      />
      <button className="go" type="submit">
        {t(ui.searchButton)}
      </button>
    </form>
  );
}

/**
 * Screen 1: finds states and schemes by name, as you type. Pressing Search opens the
 * results page, which also works before the page scripts load.
 */
export function HomeSearch({ defaultValue = '', live = true }: { defaultValue?: string; live?: boolean }) {
  const { t, tr } = useLang();
  const [q, setQ] = useState(defaultValue);
  const found = live && q.trim() ? { states: searchStates(q), schemes: searchSchemeNames(q).slice(0, 6) } : null;
  return (
    <div className="srchWrap">
      <SearchBox label={t(ui.homeSearchLabel)} placeholder={t(ui.homeSearchPlaceholder)} value={q} onChange={setQ} action="/search" />
      {found ? (
        <div className="suggest" aria-live="polite">
          {found.states.length + found.schemes.length === 0 ? <p className="none">{t(ui.noMatch)}</p> : null}
          {found.states.length ? (
            <>
              <h3>{t(ui.groupStates)}</h3>
              <ul>
                {found.states.map((st) => (
                  <li key={st.slug}>
                    {st.available ? (
                      <Link href={`/${st.slug}`}>
                        <b>{tr(st.name, st.nameTa)}</b>
                        <em className="open">{t(ui.openNow)}</em>
                      </Link>
                    ) : (
                      <span className="off">
                        <b>{tr(st.name, st.nameTa)}</b>
                        <em>{t(ui.comingSoon)}</em>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {found.schemes.length ? (
            <>
              <h3>{t(ui.groupSchemes)}</h3>
              <ul>
                {found.schemes.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/scheme/${s.slug}`}>
                      <b>{tr(s.shortName, s.nameTa)}</b>
                      <LevelTag scheme={s} />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Screen 2: finds who you are (farmer, student...), as you type. Search opens the best match. */
export function PersonaSearch({ state }: { state: StateInfo }) {
  const { t, tr } = useLang();
  const router = useRouter();
  const [q, setQ] = useState('');
  const found = q.trim() ? searchPersonas(q) : null;
  return (
    <div className="srchWrap">
      <SearchBox
        label={t(ui.personaSearchLabel)}
        placeholder={t(ui.personaSearchPlaceholder)}
        value={q}
        onChange={setQ}
        onSubmit={(e) => {
          e.preventDefault();
          if (found && found.length) router.push(`/${state.slug}/${found[0].slug}`);
        }}
      />
      {found ? (
        <div className="suggest" aria-live="polite">
          {found.length === 0 ? <p className="none">{t(ui.noMatch)}</p> : null}
          {found.length ? (
            <ul>
              {found.map((p) => (
                <li key={p.slug}>
                  <Link href={`/${state.slug}/${p.slug}`}>
                    <b>{tr(p.labelEn, p.labelTa)}</b>
                    <small>{tr(p.hintEn, p.hintTa)}</small>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Screen 3: narrows the list on the page to matching schemes; nothing outside it. */
export function ListSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const { t } = useLang();
  return (
    <SearchBox
      label={t(ui.listSearchLabel)}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onSubmit={(e) => e.preventDefault()}
    />
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
  const { t, tr } = useLang();
  return (
    <Link href={`/scheme/${scheme.slug}`} className="card">
      <span className="tags">
        <LevelTag scheme={scheme} />
        {showPlace ? <PlaceTag scheme={scheme} /> : null}
      </span>
      <b>{tr(scheme.shortName, scheme.nameTa)}</b>
      <span className="d">{tr(scheme.summaryEn, scheme.summaryTa)}</span>
      <span className="more">
        {t(ui.viewDetails)} <span aria-hidden="true">&rsaquo;</span>
      </span>
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
