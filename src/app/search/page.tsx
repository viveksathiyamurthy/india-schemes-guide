import { SearchView } from '@/components/Views';
import { findState } from '@/data/config';

export const metadata = { title: 'Search' };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string | string[]; state?: string | string[] }> }) {
  const sp = await searchParams;
  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? '';
  const query = first(sp.q).slice(0, 100);
  const found = findState(first(sp.state));
  // Only a state that is live can narrow the search; anything else searches everywhere.
  const state = found && found.available ? found : undefined;
  return <SearchView query={query} state={state} />;
}
