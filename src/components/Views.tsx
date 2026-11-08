'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useState, type CSSProperties } from 'react';
import { useLang } from '@/lib/lang';
import { ui } from '@/lib/ui';
import { formatDate } from '@/lib/text';
import { byPersona, searchPersonaSchemes, searchSchemeNames, searchStates } from '@/lib/search';
import { personas, states, type Persona, type StateInfo } from '@/data/config';
import type { Scheme } from '@/data/types';
import { Character } from './Characters';
import { StateMap } from './StateMap';
import { EarthIntro, webglWorks } from './EarthIntro';
import { BackButton, BackLink, HomeSearch, LevelTag, ListSearch, PersonaSearch, PlaceTag, RichText, SchemeCard } from './Parts';

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
        <HomeSearch />
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
        <PersonaSearch state={state} />
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

/* Screen 3: list for a chosen state and persona, over the state's own scene. Search only narrows this list. */
export function ListView({ state, persona }: { state: StateInfo; persona: Persona }) {
  const { t, tr } = useLang();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  useEffect(() => {
    document.documentElement.classList.remove('zooming');
  }, []);
  // Over a state's scene, the header and disclaimer strip turn see-through.
  useLayoutEffect(() => {
    if (!state.scene) return;
    const root = document.documentElement;
    root.classList.add('scene');
    return () => root.classList.remove('scene');
  }, [state.scene]);
  const matched = searchPersonaSchemes(state.name, persona.key, q);
  const isUnion = (s: Scheme) => s.level === 'Union/Central Government';
  const shown = matched.filter((s) => (filter === 'all' ? true : filter === 'state' ? !isUnion(s) : isUnion(s)));
  const scope = t(ui.scopeState).replace('{state}', tr(state.name, state.nameTa));
  const placeholder = t(ui.listSearchPlaceholder)
    .replace('{persona}', tr(persona.labelEn, persona.labelTa))
    .replace('{state}', tr(state.name, state.nameTa));
  const filters: { id: Filter; label: string; n: number }[] = [
    { id: 'all', label: t(ui.filterAll), n: matched.length },
    { id: 'state', label: t(ui.stateGov), n: matched.filter((s) => !isUnion(s)).length },
    { id: 'union', label: t(ui.unionGov), n: matched.filter(isUnion).length },
  ];
  return (
    <div className={state.scene ? 'stateList withScene' : 'stateList'}>
      {state.scene ? (
        <div className="sceneBg" aria-hidden="true">
          <picture>
            <source media="(min-width: 900px)" srcSet={`/states/${state.slug}-wide.jpg`} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/states/${state.slug}-tall.jpg`} alt="" />
          </picture>
          <span className="char">
            <Character kind={persona.character} />
          </span>
        </div>
      ) : null}
      <div className="listColumn">
        <div className="listTop">
          <BackLink href={`/${state.slug}`}>{t(ui.changePersona)}</BackLink>
          <div>
            <h1>
              {tr(state.name, state.nameTa)} &middot; {tr(persona.labelEn, persona.labelTa)}
            </h1>
            <p className="sub" aria-live="polite">
              {countText(shown.length, t)} {scope}
            </p>
          </div>
          <ListSearch value={q} onChange={setQ} placeholder={placeholder} />
          <div className="row filters" role="group" aria-label="Filter">
            {filters.map((f) => (
              <button key={f.id} type="button" className={filter === f.id ? 'f on' : 'f'} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label} <i>{f.n}</i>
              </button>
            ))}
          </div>
        </div>
        <div id="schemes" className="listCards">
          {shown.length === 0 ? <p className="empty">{t(ui.noResults)}</p> : null}
          <div className="cards">
            {shown.map((s) => (
              <SchemeCard key={s.id} scheme={s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Search results from screen 1: states and schemes whose name matches */
export function SearchView({ query }: { query: string }) {
  const { t, tr } = useLang();
  const foundStates = searchStates(query);
  const foundSchemes = searchSchemeNames(query);
  return (
    <div className="page">
      <BackButton fallbackHref="/" />
      <HomeSearch defaultValue={query} live={false} />
      <h1>{query ? `${t(ui.resultsFor)} "${query}"` : t(ui.allSchemes)}</h1>
      {foundStates.length + foundSchemes.length === 0 ? <p className="empty">{t(ui.noMatch)}</p> : null}
      {foundStates.length ? (
        <section className="sec">
          <h2>{t(ui.groupStates)}</h2>
          <div className="row">
            {foundStates.map((st) =>
              st.available ? (
                <Link key={st.slug} href={`/${st.slug}`} className="chip">
                  {tr(st.name, st.nameTa)} &middot; {t(ui.openNow)}
                </Link>
              ) : (
                <span key={st.slug} className="chip off">
                  {tr(st.name, st.nameTa)} &middot; {t(ui.comingSoon)}
                </span>
              ),
            )}
          </div>
        </section>
      ) : null}
      {foundSchemes.length ? (
        <section className="sec">
          <h2>{t(ui.groupSchemes)}</h2>
          <div className="cards">
            {foundSchemes.map((s) => (
              <SchemeCard key={s.id} scheme={s} showPlace />
            ))}
          </div>
        </section>
      ) : null}
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
