import { schemes } from '@/data/schemes';
import type { Scheme } from '@/data/types';
import { personas, states, type Persona, type StateInfo } from '@/data/config';

const UNION = 'Union/Central Government';

/**
 * Publishing rule from the PRD: a scheme is shown only if it is confirmed live (Active),
 * marked Verified, and has an official link.
 */
export const published: Scheme[] = schemes.filter(
  (s) => s.status === 'Active' && s.reviewStatus === 'Verified' && s.officialLink.trim() !== '',
);

/**
 * Scope rule: once a state is chosen, only that state's schemes and Union/Central Government
 * schemes are visible. With no state chosen, everything is visible.
 */
export function inScope(s: Scheme, stateName?: string): boolean {
  if (!stateName) return true;
  return s.level === UNION || s.state === stateName;
}

/** State Government schemes first, then Union/Central Government, then by id. */
function order(a: Scheme, b: Scheme): number {
  const rank = (s: Scheme) => (s.level === UNION ? 1 : 0);
  return rank(a) - rank(b) || a.id - b.id;
}

export function byPersona(stateName: string, personaKey: string): Scheme[] {
  return published.filter((s) => inScope(s, stateName) && s.userTypes.includes(personaKey)).sort(order);
}

export function getScheme(slug: string): Scheme | undefined {
  return published.find((s) => s.slug === slug);
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Every typed word must be found in `text`. */
function matchesAll(terms: string[], text: string): boolean {
  return terms.every((term) => text.includes(term));
}

function termsOf(query: string): string[] {
  return normalise(query).split(' ').filter(Boolean);
}

/**
 * Search by words across names, summaries, benefits, eligibility, department and user types
 * (English and Tamil). Every typed word must be found. Name matches rank first.
 * An empty query returns the whole list.
 */
function rankSchemes(list: Scheme[], query: string): Scheme[] {
  const terms = termsOf(query);
  if (terms.length === 0) return [...list].sort(order);

  const scored: { scheme: Scheme; score: number }[] = [];
  for (const scheme of list) {
    const names = normalise([scheme.shortName, scheme.nameEn, scheme.nameTa].join(' '));
    const summary = normalise([scheme.summaryEn, scheme.summaryTa].join(' '));
    const rest = normalise(
      [scheme.benefitEn, scheme.eligibilityEn, scheme.department, scheme.userTypes.join(' ')].join(' '),
    );
    let score = 0;
    let all = true;
    for (const term of terms) {
      if (names.includes(term)) score += 3;
      else if (summary.includes(term)) score += 2;
      else if (rest.includes(term)) score += 1;
      else {
        all = false;
        break;
      }
    }
    if (all) scored.push({ scheme, score });
  }
  return scored.sort((a, b) => b.score - a.score || order(a.scheme, b.scheme)).map((x) => x.scheme);
}

/** Full-text search across every scheme in scope (all states when no state is given). */
export function searchSchemes(query: string, stateName?: string): Scheme[] {
  return rankSchemes(
    published.filter((s) => inScope(s, stateName)),
    query,
  );
}

/* ---------- Search on each screen ---------- */

/** Screen 1: states, by English name, Tamil name or the name in the state's own language. */
export function searchStates(query: string): StateInfo[] {
  const terms = termsOf(query);
  if (terms.length === 0) return [];
  return states.filter((st) => matchesAll(terms, normalise([st.name, st.nameTa, st.local, st.slug.replace(/-/g, ' ')].join(' '))));
}

/** Screen 1: schemes by name only (short name, English and Tamil names), across all states. */
export function searchSchemeNames(query: string): Scheme[] {
  const terms = termsOf(query);
  if (terms.length === 0) return [];
  return published
    .filter((s) => matchesAll(terms, normalise([s.shortName, s.nameEn, s.nameTa].join(' '))))
    .sort(order);
}

/** Everyday words people may type for each persona, in English and Tamil. */
const personaWords: Record<string, string[]> = {
  msme: ['business', 'shop', 'shopkeeper', 'enterprise', 'industry', 'small', 'micro', 'medium', 'self employed', 'startup', 'trader', 'வணிகம்', 'தொழில்', 'கடை', 'வியாபாரம்'],
  farmer: ['farm', 'farming', 'agriculture', 'crop', 'kisan', 'paddy', 'விவசாயம்', 'பயிர்', 'உழவர்'],
  home: ['house', 'housing', 'build', 'construction', 'rent', 'flat', 'plot', 'வீடு', 'கட்டுமானம்', 'குடியிருப்பு'],
  student: ['school', 'college', 'scholarship', 'education', 'study', 'studies', 'university', 'கல்வி', 'பள்ளி', 'கல்லூரி', 'படிப்பு'],
  woman: ['women', 'lady', 'ladies', 'mother', 'girl', 'self help group', 'shg', 'magalir', 'மகளிர்', 'தாய்', 'பெண்', 'பெண்கள்'],
  senior: ['senior', 'elderly', 'old age', 'old', 'pension', 'retired', 'grandfather', 'grandmother', 'aged', 'முதியோர்', 'ஓய்வூதியம்', 'வயதானவர்'],
  others: ['worker', 'labour', 'labourer', 'daily wage', 'unorganised', 'disabled', 'differently abled', 'disability', 'wheelchair', 'blind', 'transgender', 'ews', 'தொழிலாளி', 'மாற்றுத்திறனாளி', 'திருநங்கை', 'கூலி'],
};

/** Screen 2: personas, by their label, hint or everyday words for them. */
export function searchPersonas(query: string): Persona[] {
  const terms = termsOf(query);
  if (terms.length === 0) return [];
  return personas.filter((p) =>
    matchesAll(terms, normalise([p.key, p.labelEn, p.labelTa, p.hintEn, p.hintTa, ...(personaWords[p.slug] ?? [])].join(' '))),
  );
}

/** Screen 3: only the schemes for the chosen state and persona. */
export function searchPersonaSchemes(stateName: string, personaKey: string, query: string): Scheme[] {
  return rankSchemes(byPersona(stateName, personaKey), query);
}
