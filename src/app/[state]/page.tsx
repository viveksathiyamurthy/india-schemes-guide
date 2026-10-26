import { notFound } from 'next/navigation';
import { PersonaView } from '@/components/Views';
import { findState, states } from '@/data/config';

export const dynamicParams = false;

export function generateStaticParams() {
  return states.filter((s) => s.available).map((s) => ({ state: s.slug }));
}

export default async function Page({ params }: { params: Promise<{ state: string }> }) {
  const { state: slug } = await params;
  const state = findState(slug);
  if (!state || !state.available) notFound();
  return <PersonaView state={state} />;
}
