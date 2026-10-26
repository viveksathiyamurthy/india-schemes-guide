import { notFound } from 'next/navigation';
import { ListView } from '@/components/Views';
import { findPersona, findState, personas, states } from '@/data/config';

export const dynamicParams = false;

export function generateStaticParams() {
  return states
    .filter((s) => s.available)
    .flatMap((s) => personas.map((p) => ({ state: s.slug, persona: p.slug })));
}

export default async function Page({ params }: { params: Promise<{ state: string; persona: string }> }) {
  const { state: stateSlug, persona: personaSlug } = await params;
  const state = findState(stateSlug);
  const persona = findPersona(personaSlug);
  if (!state || !state.available || !persona) notFound();
  return <ListView state={state} persona={persona} />;
}
