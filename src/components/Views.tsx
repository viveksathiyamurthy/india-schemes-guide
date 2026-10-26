'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLang } from '@/lib/lang';
import { ui } from '@/lib/ui';
import { formatDate } from '@/lib/text';
import { byPersona, searchSchemes } from '@/lib/search';
import { personas, states, type Persona, type StateInfo } from '@/data/config';
import type { Scheme } from '@/data/types';
import { BackButton, BackLink, LevelTag, PlaceTag, RichText, SchemeCard, SearchBar } from './Parts';

/* Screen 1: welcome, search and choose a state */
export function WelcomeView() {
  const { t, tr } = useLang();
  return (
    <div className="page">
      <section className="hero">
        <h1>{t(ui.welcomeTitle)}</h1>
        <p>{t(ui.welcomeSub)}</p>
        <svg className="fold" width="120" height="110" viewBox="0 0 120 110" aria-hidden="true">
          <polygon points="10,100 118,20 90,108" fill="#FFFBFA" opacity="0.55" />
          <polygon points="10,100 90,108 52,72" fill="#2a2230" opacity="0.85" />
          <polygon points="118,20 52,72 90,108" fill="#FFFBFA" opacity="0.3" />
        </svg>
      </section>
      <SearchBar />
      <h2>{t(ui.chooseState)}</h2>
      <div className="stack">
        {states.map((s) =>
          s.available ? (
            <Link key={s.slug} href={`/${s.slug}`} className="st on">
              {tr(s.name, s.nameTa)} <span className="pill a">{t(ui.available)}</span>
            </Link>
          ) : (
            <div key={s.slug} className="st off">
              {tr(s.name, s.nameTa)} <span className="pill c">{t(ui.comingSoon)}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

/* Screen 2: choose a persona */
export function PersonaView({ state }: { state: StateInfo }) {
  const { t, tr } = useLang();
  return (
    <div className="page">
      <BackLink href="/">{t(ui.changeState)}</BackLink>
      <span className="chip">{tr(state.name, state.nameTa)}</span>
      <h1>{t(ui.whoAreYou)}</h1>
      <SearchBar stateSlug={state.slug} />
      <div className="stack">
        {personas.map((p) => (
          <Link key={p.slug} href={`/${state.slug}/${p.slug}`} className="who">
            <span className="dot" aria-hidden="true">
              {p.letter}
            </span>
            <span>
              <b>{tr(p.labelEn, p.labelTa)}</b>
              <small>{tr(p.hintEn, p.hintTa)}</small>
            </span>
            <span className="go2" aria-hidden="true">
              &rsaquo;
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

type Filter = 'all' | 'state' | 'union';

function countText(n: number, t: (x: { en: string; ta: string }) => string) {
  return `${n} ${n === 1 ? t(ui.schemeCount1) : t(ui.schemesCount)}`;
}

/* Screen 3: list for a chosen state and persona */
export function ListView({ state, persona }: { state: StateInfo; persona: Persona }) {
  const { t, tr } = useLang();
  const [filter, setFilter] = useState<Filter>('all');
  const all = byPersona(state.name, persona.key);
  const shown = all.filter((s) =>
    filter === 'all' ? true : filter === 'state' ? s.level === 'State Government' : s.level === 'Union/Central Government',
  );
  const scope = t(ui.scopeState).replace('{state}', tr(state.name, state.nameTa));
  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t(ui.filterAll) },
    { id: 'state', label: t(ui.stateGov) },
    { id: 'union', label: t(ui.unionGov) },
  ];
  return (
    <div className="page">
      <BackLink href={`/${state.slug}`}>{t(ui.changePersona)}</BackLink>
      <div>
        <h1>
          {tr(state.name, state.nameTa)} &middot; {tr(persona.labelEn, persona.labelTa)}
        </h1>
        <p className="sub">
          {countText(shown.length, t)} {scope}
        </p>
      </div>
      <SearchBar stateSlug={state.slug} />
      <div className="row" role="group" aria-label="Filter">
        {filters.map((f) => (
          <button key={f.id} type="button" className={filter === f.id ? 'f on' : 'f'} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? <p className="empty">{t(ui.noResults)}</p> : null}
      <div className="cards">
        {shown.map((s) => (
          <SchemeCard key={s.id} scheme={s} />
        ))}
      </div>
    </div>
  );
}

/* Screen 3 (search): results for a search text, with or without a state */
export function SearchView({ query, state }: { query: string; state?: StateInfo }) {
  const { t, tr } = useLang();
  const results = searchSchemes(query, state?.name);
  const scope = state ? t(ui.scopeState).replace('{state}', tr(state.name, state.nameTa)) : t(ui.scopeAll);
  return (
    <div className="page">
      <BackButton fallbackHref={state ? `/${state.slug}` : '/'} />
      <SearchBar stateSlug={state?.slug} defaultValue={query} />
      <div>
        <h1>{query ? `${t(ui.resultsFor)} "${query}"` : t(ui.allSchemes)}</h1>
        <p className="sub">
          {countText(results.length, t)} {scope}
        </p>
      </div>
      {!state ? (
        <div className="note">
          <span>{t(ui.noStateNote)}</span>
          <Link href="/">{t(ui.chooseStateButton)}</Link>
        </div>
      ) : null}
      {results.length === 0 ? <p className="empty">{t(ui.noResults)}</p> : null}
      <div className="cards">
        {results.map((s) => (
          <SchemeCard key={s.id} scheme={s} showPlace={!state} />
        ))}
      </div>
    </div>
  );
}

function Section({ title, en, ta }: { title: string; en: string; ta: string }) {
  const { lang } = useLang();
  const { t } = useLang();
  const missingTamil = lang === 'ta' && !ta.trim();
  return (
    <section className="sec">
      <h2>{title}</h2>
      <RichText text={lang === 'ta' && ta.trim() ? ta : en} />
      {missingTamil ? <p className="pending">{t(ui.tamilPending)}</p> : null}
    </section>
  );
}

/* Screen 4: full details, with the link to the official government website */
export function DetailView({ scheme }: { scheme: Scheme }) {
  const { t, tr } = useLang();
  const showSecondary = scheme.applyLink.trim() !== '' && scheme.applyLink !== scheme.officialLink;
  return (
    <div className="page detail">
      <BackButton />
      <span className="tags">
        <LevelTag scheme={scheme} />
        <PlaceTag scheme={scheme} />
      </span>
      <h1>{tr(scheme.shortName, scheme.nameTa)}</h1>
      <p className="sub">
        {t(ui.department)}: {scheme.department}
      </p>
      <Section title={t(ui.whatYouGet)} en={scheme.benefitEn} ta={scheme.benefitTa} />
      <Section title={t(ui.whoIsEligible)} en={scheme.eligibilityEn} ta={scheme.eligibilityTa} />
      <Section title={t(ui.documentsRequired)} en={scheme.documentsEn} ta={scheme.documentsTa} />
      <Section title={t(ui.howToApply)} en={scheme.howToApplyEn} ta={scheme.howToApplyTa} />
      <p className="sub">
        {t(ui.lastVerified)}: {formatDate(scheme.lastVerified)}
      </p>
      <div className="cta">
        <a className="btn" href={scheme.officialLink} target="_blank" rel="noopener noreferrer">
          {t(ui.officialButton)}
        </a>
        {showSecondary ? (
          <a className="btn alt" href={scheme.applyLink} target="_blank" rel="noopener noreferrer">
            {t(ui.applyButton)}
          </a>
        ) : null}
        <p className="sub center">{t(ui.confirmNote)}</p>
      </div>
    </div>
  );
}

export function NotFoundView() {
  const { t } = useLang();
  return (
    <div className="page">
      <h1>{t(ui.notFoundTitle)}</h1>
      <p>{t(ui.notFoundText)}</p>
      <Link href="/" className="btn">
        {t(ui.goHome)}
      </Link>
    </div>
  );
}
