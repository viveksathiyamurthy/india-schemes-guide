import { schemes } from '@/data/schemes';
import type { Scheme } from '@/data/types';

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

/**
 * Search by words across names, summaries, benefits, eligibility, department and user types
 * (English and Tamil). Every typed word must be found. Name matches rank first.
 * An empty query returns every scheme in scope.
 */
export function searchSchemes(query: string, stateName?: string): Scheme[] {
  const terms = normalise(query).split(' ').filter(Boolean);
  const scoped = published.filter((s) => inScope(s, stateName));
  if (terms.length === 0) return scoped.sort(order);

  const scored: { scheme: Scheme; score: number }[] = [];
  for (const scheme of scoped) {
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
