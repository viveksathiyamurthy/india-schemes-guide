'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useState, type CSSProperties } from 'react';
import { useLang } from '@/lib/lang';
import { ui } from '@/lib/ui';
import { formatDate } from '@/lib/text';
import { byPersona, searchSchemes } from '@/lib/search';
import { personas, states, type Persona, type StateInfo } from '@/data/config';
import type { Scheme } from '@/data/types';
import { Character } from './Characters';
import { StateMap } from './StateMap';
import { EarthIntro, webglWorks } from './EarthIntro';
import { BackButton, BackLink, LevelTag, PlaceTag, RichText, SchemeCard, SearchBar } from './Parts';

/* Screen 1: welcome, search and choose a state on the map */
export function WelcomeView() {
  const { t } = useLang();
  // Start with an empty frame, then show the 3D planet, or the flat map on devices that cannot draw 3D.
  const [view, setView] = useState<'wait' | 'planet' | 'flat'>('wait');
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    document.documentElement.classList.remove('zooming');
    setCalm(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setView(webglWorks() ? 'planet' : 'flat');
  }, []);
  // On the 3D globe the whole screen is space. The strip and search only appear once the zoom has finished.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (view === 'planet' || view === 'wait') root.classList.add('space');
    else root.classList.remove('space', 'spaceReady');
    return () => root.classList.remove('space', 'spaceReady');
  }, [view]);
  return (
    <div className="page welcome">
      <div className="intro">
        <h1>{t(ui.welcomeTitle)}</h1>
        <p className="sub">{t(ui.welcomeSub)}</p>
        <SearchBar />
        <h2 className="mapTitle">{t(ui.chooseState)}</h2>
      </div>
      {view === 'planet' ? <EarthIntro calm={calm} onFail={() => setView('flat')} onReady={() => document.documentElement.classList.add('spaceReady')} /> : view === 'flat' ? <StateMap /> : <div className="planetStage"><div className="planetBox" /></div>}
    </div>
  );
}

/**
 * public/personas/road.jpg: one painted road running down through the five places, in the
 * order of `personas` (scripts/build-persona-road.py). Rows are where each place starts, in
 * image pixels; the road runs down at ROAD.x.
 */
const ROAD = { w: 1456, h: 3210, x: 365 };
const ROAD_ROWS = [0, 695, 1295, 1895, 2495, 3210];

/* Screen 2: choose a persona. One row per persona, down the road; scroll up and down. */
export function PersonaView({ state }: { state: StateInfo }) {
  const { t, tr } = useLang();
  useEffect(() => {
    document.documentElement.classList.remove('zooming');
  }, []);
  const pct = (px: number) => `${(px / ROAD.h) * 100}%`;
  return (
    <div className="persona">
      <div className="personaIntro">
        <div className="row">
          <BackLink href="/">{t(ui.changeState)}</BackLink>
          <span className="chip">{tr(state.name, state.nameTa)}</span>
        </div>
        <h1>{t(ui.whoAreYou)}</h1>
        <p className="sub personaSub">{t(ui.personaIntro).replace('{state}', tr(state.name, state.nameTa))}</p>
        <SearchBar stateSlug={state.slug} />
      </div>
      <div className="road" style={{ aspectRatio: `${ROAD.w} / ${ROAD.h}`, '--road-x': `${(ROAD.x / ROAD.w) * 100}%` } as CSSProperties}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="roadImg" src="/personas/road.jpg" alt="" />
        <ul>
          {personas.map((p, i) => (
            <li key={p.slug} style={{ top: pct(ROAD_ROWS[i]), height: pct(ROAD_ROWS[i + 1] - ROAD_ROWS[i]) }}>
              <Link href={`/${state.slug}/${p.slug}`} className="who">
                <span className="char">
                  <Character kind={p.character} />
                </span>
                <span className="whoCard">
                  <span>
                    <b>{tr(p.labelEn, p.labelTa)}</b>
                    <small>{tr(p.hintEn, p.hintTa)}</small>
                  </span>
                  <span className="go2" aria-hidden="true">
                    &rsaquo;
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
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
  useEffect(() => {
    document.documentElement.classList.remove('zooming');
  }, []);
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
