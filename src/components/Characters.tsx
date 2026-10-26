/**
 * The people shown next to the choices on the persona screen.
 * They are illustrations (public/characters/<kind>.png) with the background already removed.
 */
export type CharacterKind = 'msme' | 'farmer' | 'home' | 'student' | 'woman';

export function Character({ kind }: { kind: CharacterKind }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="ch-img" src={`/characters/${kind}.png`} alt="" draggable={false} decoding="async" />;
}
