import { SearchView } from '@/components/Views';

export const metadata = { title: 'Search' };

/** Results for a search from screen 1: matching states and scheme names. */
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const sp = await searchParams;
  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? '';
  return <SearchView query={first(sp.q).slice(0, 100)} />;
}
