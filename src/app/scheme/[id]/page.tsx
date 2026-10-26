import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DetailView } from '@/components/Views';
import { getScheme, published } from '@/lib/search';

export const dynamicParams = false;

export function generateStaticParams() {
  return published.map((s) => ({ id: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const scheme = getScheme(id);
  return scheme ? { title: scheme.shortName, description: scheme.summaryEn } : {};
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scheme = getScheme(id);
  if (!scheme) notFound();
  return <DetailView scheme={scheme} />;
}
