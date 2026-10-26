import type { ReactNode } from 'react';

/**
 * Original characters in a bold action-anime style: clean dark outlines, flat colours,
 * one hard-edged shadow, sharp spiky hair and determined eyes. Every character is an invented
 * person, not taken from any existing film, series or game.
 * Parts are grouped (arm-l, arm-r, leg-l, leg-r) so CSS can make them walk and raise a hand.
 */
export type CharacterKind = 'msme' | 'farmer' | 'home' | 'student' | 'woman';

export const skinTones: Record<CharacterKind, string> = {
  msme: '#D9A27C',
  farmer: '#B97F58',
  home: '#E3B590',
  student: '#DFAA85',
  woman: '#E6B58F',
};

/** Outline colour. */
const LINE = '#21162B';
const DARK = '#21162B';

/** An arm or leg: a soft outline under a plain colour. */
function Limb({ d, w, color }: { d: string; w: number; color: string }) {
  return (
    <>
      <path d={d} stroke={LINE} strokeWidth={w + 2.6} strokeLinecap="round" fill="none" />
      <path d={d} stroke={color} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  );
}

function Face({
  skin,
  hair,
  iris = '#4A2E22',
  lashes,
  moustache,
  glasses,
}: {
  skin: string;
  hair: string;
  iris?: string;
  lashes?: boolean;
  moustache?: boolean;
  glasses?: boolean;
}) {
  return (
    <g>
      <ellipse cx="42.6" cy="36" rx="2.8" ry="4.2" fill={skin} stroke={LINE} strokeWidth="1.7" />
      <ellipse cx="77.4" cy="36" rx="2.8" ry="4.2" fill={skin} stroke={LINE} strokeWidth="1.7" />
      <path
        d="M43 31 C43 20 50 14 60 14 C70 14 77 20 77 31 C77 42 72 50 66 54 Q60 57 54 54 C48 50 43 42 43 31Z"
        fill={skin}
        stroke={LINE}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M69 22 C75 26 76 36 72 45 C70 50 67 53 64 55 Q69 50 71 44 C73 36 73 28 69 22Z" fill="#8A3A2A" opacity="0.2" />
      {[
        { x: 53.2, d: 'M47.6 35.8 Q52.6 32 58.4 34.6 Q57.2 38.4 53.2 38.6 Q49 38.4 47.6 35.8Z', lid: 'M46.8 36.2 Q52.6 31 59 34.4', flick: 'M46.8 36 l-2.4 -1.6' },
        { x: 66.8, d: 'M61.6 34.6 Q67.4 32 72.4 35.8 Q71 38.4 66.8 38.6 Q62.8 38.4 61.6 34.6Z', lid: 'M61 34.4 Q67.4 31 73.2 36.2', flick: 'M73.2 36 l2.4 -1.6' },
      ].map((e) => (
        <g key={e.x}>
          <path d={e.d} fill="#fff" />
          <ellipse cx={e.x} cy="36" rx="2.5" ry="2.6" fill={iris} />
          <ellipse cx={e.x} cy="36.1" rx="1.2" ry="1.7" fill={DARK} />
          <circle cx={e.x - 0.9} cy="35.2" r="0.8" fill="#fff" />
          <path d={e.lid} stroke={DARK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {lashes ? <path d={e.flick} stroke={DARK} strokeWidth="1.8" strokeLinecap="round" /> : null}
        </g>
      ))}
      <path d="M47.4 27.2 L57.2 28.8" stroke={hair} strokeWidth={lashes ? 1.6 : 2} strokeLinecap="round" />
      <path d="M72.6 27.2 L62.8 28.8" stroke={hair} strokeWidth={lashes ? 1.6 : 2} strokeLinecap="round" />
      {glasses ? (
        <g fill="#fff" fillOpacity="0.2" stroke="#3B2A2F" strokeWidth="1.5">
          <circle cx="53.2" cy="36" r="6" />
          <circle cx="66.8" cy="36" r="6" />
          <path d="M59 35 Q60 34 61 35" fill="none" />
        </g>
      ) : null}
      <path d="M60.4 39.4 L59 43.4 L61.6 43.8" stroke={LINE} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M55.6 47.6 Q60 49.8 65 46.6" stroke={DARK} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <path d="M65 46.6 l1.6 -1" stroke={DARK} strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="48.6" cy="43" rx="3" ry="1.6" fill="#E8806F" opacity="0.3" />
      {moustache ? <path d="M53 44.4 Q57 41.6 60 43.4 Q63 41.6 67 44.4 Q63 45.2 60 44.8 Q57 45.2 53 44.4Z" fill={hair} stroke={LINE} strokeWidth="0.8" /> : null}
    </g>
  );
}

const Neck = ({ skin }: { skin: string }) => (
  <g>
    <path d="M56 52 L56 63 Q60 66 64 63 L64 52Z" fill={skin} stroke={LINE} strokeWidth="1.7" />
    <path d="M56.4 54 Q60 59 63.6 54 L63.6 58 Q60 63 56.4 58Z" fill="#000" opacity="0.1" />
  </g>
);

function Legs({
  leg,
  sock,
  shoe,
  barefoot,
  skin,
}: {
  leg: string;
  sock?: string;
  shoe: string;
  barefoot?: boolean;
  skin: string;
}) {
  return (
    <>
      {(
        [
          ['leg-l', 54],
          ['leg-r', 66],
        ] as [string, number][]
      ).map(([cls, x]) => (
        <g key={cls} className={`ch-${cls}`} style={{ transformOrigin: `${x}px 116px` }}>
          <Limb d={`M${x} 118 L${x} 178`} w={9.5} color={leg} />
          {sock ? <Limb d={`M${x} 168 L${x} 180`} w={8.4} color={sock} /> : null}
          {barefoot ? (
            <ellipse cx={x} cy="186" rx="6.4" ry="3.2" fill={skin} stroke={LINE} strokeWidth="1.7" />
          ) : (
            <>
              <path
                d={`M${x - 5.6} 181 L${x + 5.6} 181 Q${x + 9} 183 ${x + 8} 187 Q${x} 190 ${x - 6} 187Z`}
                fill={shoe}
                stroke={LINE}
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </>
          )}
        </g>
      ))}
    </>
  );
}

function Arms({
  sleeve,
  skin,
  sleeveEnd = 92,
  left,
  right,
}: {
  sleeve: string;
  skin: string;
  /** How far down the arm the sleeve reaches. */
  sleeveEnd?: number;
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <>
      <g className="ch-arm-l" style={{ transformOrigin: '44px 66px' }}>
        <Limb d="M44 67 Q39 92 39.5 116" w={6.2} color={skin} />
        <Limb d={`M44 67 Q40.6 ${sleeveEnd - 14} 40.3 ${sleeveEnd}`} w={9.4} color={sleeve} />
        <circle cx="39.5" cy="119.5" r="4.4" fill={skin} stroke={LINE} strokeWidth="1.7" />
        {left}
      </g>
      <g className="ch-arm-r" style={{ transformOrigin: '76px 66px' }}>
        <Limb d="M76 67 Q81 92 80.5 116" w={6.2} color={skin} />
        <Limb d={`M76 67 Q79.4 ${sleeveEnd - 14} 79.7 ${sleeveEnd}`} w={9.4} color={sleeve} />
        <circle cx="80.5" cy="119.5" r="4.4" fill={skin} stroke={LINE} strokeWidth="1.7" />
        {right}
        <circle className="ch-hand" cx="80.5" cy="121" r="3" fill="none" />
      </g>
    </>
  );
}

/** Soft shading over a garment, darker on the right side, like light from the left. */
const Shade = ({ d }: { d: string }) => <path d={d} fill="url(#chShade)" />;

export function Character({
  kind,
  walking = false,
  raised = false,
}: {
  kind: CharacterKind;
  walking?: boolean;
  raised?: boolean;
}) {
  const skin = skinTones[kind];
  const cls = `ch${walking ? ' walking' : ''}${raised ? ' raised' : ''}`;
  return (
    <svg className={cls} viewBox="0 0 120 210" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="chShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a1040" stopOpacity="0" />
          <stop offset="0.64" stopColor="#2a1040" stopOpacity="0" />
          <stop offset="0.64" stopColor="#2a1040" stopOpacity="0.24" />
          <stop offset="1" stopColor="#2a1040" stopOpacity="0.24" />
        </linearGradient>
      </defs>
      <ellipse className="ch-shadow" cx="60" cy="192" rx="28" ry="4.2" fill="#3a2418" opacity="0.16" />
      <g>
        <g className="ch-body">
          {kind === 'msme' ? <Msme skin={skin} /> : null}
          {kind === 'farmer' ? <Farmer skin={skin} /> : null}
          {kind === 'home' ? <Home skin={skin} /> : null}
          {kind === 'student' ? <Student skin={skin} /> : null}
          {kind === 'woman' ? <Woman skin={skin} /> : null}
        </g>
      </g>
    </svg>
  );
}

const TORSO = 'M44 63 Q60 67 76 63 L79 120 Q60 125 41 120Z';

/* ---------- Shopkeeper / small business owner ---------- */
function Msme({ skin }: { skin: string }) {
  const hair = '#3A2A2C';
  return (
    <>
      <Legs leg="#7C7064" shoe="#6B4A36" skin={skin} />
      <Arms
        sleeve="#EFE3C6"
        skin={skin}
        sleeveEnd={108}
        left={
          <g transform="rotate(-8 30 124)">
            <rect x="21" y="110" width="17" height="22" rx="1.8" fill="#B5584B" stroke={LINE} strokeWidth="1.7" />
            <rect x="22.4" y="110" width="2" height="22" fill="#8C3F36" />
            <rect x="27" y="116" width="8" height="2" rx="1" fill="#F0D79A" />
            <rect x="27" y="120" width="6" height="1.6" rx="0.8" fill="#F0D79A" />
            <circle cx="37.5" cy="124" r="4.2" fill={skin} stroke={LINE} strokeWidth="1.7" />
          </g>
        }
      />
      <g className="ch-garment">
        <path d="M44 63 Q60 67 76 63 L81 142 Q60 148 39 142Z" fill="#EFE3C6" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M44 63 L55 66 L56 144 L39 142Z" fill="#3F78C2" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M76 63 L65 66 L64 144 L81 142Z" fill="#3F78C2" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        {[78, 90, 102, 114].map((y) => (
          <circle key={y} cx="60" cy={y} r="1.3" fill="#E9CF8A" stroke={LINE} strokeWidth="1.7" />
        ))}
        <path d="M55 64 Q60 72 65 64" stroke={LINE} strokeWidth="1.7" fill="#EFE3C6" />
        <Shade d="M44 63 Q60 67 76 63 L81 142 Q60 148 39 142Z" />
      </g>
      <Neck skin={skin} />
      <Face skin={skin} hair={hair} glasses />
      <path
        d="M42 33 C39 18 46 9 57 8 L55 0 L63 6 L69 -1 L71 7 L79 4 L77 13 C81 21 80 28 78 35 C76 28 72 24 67 22 L64 28 L59 21 L55 28 L50 23 C45 24 43 28 42 33Z"
        fill={hair}
        stroke={LINE}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M49 15.5 Q57 11.5 66 13" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  );
}

/* ---------- Farmer ---------- */
function Farmer({ skin }: { skin: string }) {
  const hair = '#33262A';
  return (
    <>
      <Legs leg={skin} shoe="#000" barefoot skin={skin} />
      <Arms
        sleeve="#F2EBDD"
        skin={skin}
        sleeveEnd={100}
        left={
          <g transform="rotate(-5 32 128)">
            {[-6, -3, 0, 3, 6].map((o) => (
              <g key={o}>
                <path d={`M${36 + o * 0.4} 130 Q${30 + o} 116 ${26 + o * 1.8} 98`} stroke="#B89A45" strokeWidth="1.1" strokeLinecap="round" fill="none" />
                <ellipse cx={26 + o * 1.8} cy="96" rx="1.9" ry="4.4" fill="#E2BE5C" stroke={LINE} strokeWidth="1.7" transform={`rotate(${o * 2.4} ${26 + o * 1.8} 96)`} />
              </g>
            ))}
            <circle cx="38" cy="122" r="4.4" fill={skin} stroke={LINE} strokeWidth="1.7" />
            <path d="M31 126 L44 124" stroke="#D9482B" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        }
      />
      <g className="ch-garment">
        <path d="M44 63 Q60 67 76 63 L79 122 Q60 128 41 122Z" fill="#F2EBDD" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M60 70 L60 124" stroke={LINE} strokeWidth="1.7" opacity="0.6" />
        <path d="M70 64 L82 72 L84 106 L76 108 L73 86Z" fill="#D9482B" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M73 72 L83 78 M74 84 L84 90 M75 96 L84 101" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" />
        <Shade d="M44 63 Q60 67 76 63 L79 122 Q60 128 41 122Z" />
        {/* veshti (wrapped cloth) */}
        <path d="M41 116 L79 116 L85 184 Q60 190 35 184Z" fill="#FBF7EE" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M51 120 Q49 150 45 182 M60 120 L60 188 M69 120 Q71 150 75 182" stroke={LINE} strokeOpacity="0.4" strokeWidth="1.7" fill="none" />
        <path d="M36 178 L84 178" stroke="#C23A3A" strokeWidth="2.6" />
        <Shade d="M41 116 L79 116 L85 184 Q60 190 35 184Z" />
      </g>
      <Neck skin={skin} />
      <Face skin={skin} hair={hair} moustache />
      {/* head cloth */}
      <path
        d="M41.5 30 C40 14 50 6.5 60 6.5 C70.5 6.5 80 14 78.5 30 C72 23.5 66 21.5 60 21.5 C54 21.5 48 23.5 41.5 30Z"
        fill="#F4EBD9"
        stroke={LINE}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M44 26 C50 16 70 16 76 26 M43 19 C50 10 70 10 77 19" stroke="#C9B994" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M77 17 Q92 22 88 40 Q86 31 80 28Z" fill="#F4EBD9" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
    </>
  );
}

/* ---------- Home seeker / house owner ---------- */
function Home({ skin }: { skin: string }) {
  const hair = '#3C2B28';
  return (
    <>
      <Legs leg="#C2AE82" shoe="#EDE3CF" skin={skin} />
      <Arms
        sleeve="#2FAE93"
        skin={skin}
        sleeveEnd={84}
        left={
          <g transform="rotate(-5 30 124)">
            <rect x="19" y="112" width="20" height="14" rx="1.2" fill="#F6EAD0" stroke={LINE} strokeWidth="1.7" />
            <path d="M15 114 L29 100 L43 114Z" fill="#C4624F" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
            <rect x="26" y="118" width="5.4" height="8" rx="0.8" fill="#8A6244" stroke={LINE} strokeWidth="1.7" />
            <rect x="20.8" y="115" width="4" height="4" fill="#A9D3E3" stroke={LINE} strokeWidth="1.7" />
            <rect x="33" y="115" width="4" height="4" fill="#A9D3E3" stroke={LINE} strokeWidth="1.7" />
            <circle cx="39" cy="124" r="4.2" fill={skin} stroke={LINE} strokeWidth="1.7" />
          </g>
        }
        right={
          <g>
            <circle cx="86" cy="127" r="2.5" fill="none" stroke="#D9B04A" strokeWidth="1.4" />
            <path d="M86 129.5 L86 138 M86 135.4 l2.4 0 M86 137.6 l1.8 0" stroke="#D9B04A" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        }
      />
      <g className="ch-garment">
        <path d="M44 63 Q60 67 76 63 L79 122 Q60 128 41 122Z" fill="#2FAE93" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M54 64 L60 76 L66 64Z" fill="#F2EBDD" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M60 76 L60 122" stroke={LINE} strokeWidth="1.7" opacity="0.6" />
        <path d="M41 116 L79 116 L80 126 Q60 132 40 126Z" fill="#A9936A" stroke={LINE} strokeWidth="1.7" />
        <Shade d="M44 63 Q60 67 76 63 L79 122 Q60 128 41 122Z" />
      </g>
      <Neck skin={skin} />
      <Face skin={skin} hair={hair} />
      <path
        d="M41.5 34 C38 16 48 6 59 6 L57 -2 L66 4 L72 -3 L73 6 L82 3 L79 14 C83 22 81 29 78.5 35 C76.5 28 73 24 69 23 L66 28 L62 22 L57 28 L52 23 C47 24 43 28 41.5 34Z"
        fill={hair}
        stroke={LINE}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M48 15 Q56 10.5 65 12" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  );
}

/* ---------- Student ---------- */
function Student({ skin }: { skin: string }) {
  const hair = '#32232A';
  return (
    <>
      {[1, -1].map((s) => (
        <g key={s}>
          <path d={`M${60 - 17 * s} 36 C${60 - 31 * s} 56 ${60 - 32 * s} 80 ${60 - 28 * s} 100`} stroke={LINE} strokeWidth="8.2" strokeLinecap="round" fill="none" />
          <path d={`M${60 - 17 * s} 36 C${60 - 31 * s} 56 ${60 - 32 * s} 80 ${60 - 28 * s} 100`} stroke={hair} strokeWidth="7" strokeLinecap="round" fill="none" />
          <path
            d={`M${60 - 26 * s} 56 l${4 * s} 2 M${60 - 29 * s} 66 l${4 * s} 2 M${60 - 30 * s} 76 l${4 * s} 2 M${60 - 30 * s} 86 l${4 * s} 2`}
            stroke="#fff"
            strokeOpacity="0.15"
            strokeWidth="1.2"
          />
          <circle cx={60 - 28 * s} cy="102" r="3.4" fill="#C8504A" stroke={LINE} strokeWidth="1.7" />
        </g>
      ))}
      <Legs leg={skin} sock="#F6F1E6" shoe="#4A3328" skin={skin} />
      <Arms
        sleeve="#FAF6EC"
        skin={skin}
        sleeveEnd={84}
        left={
          <g transform="rotate(-4 32 124)">
            <rect x="21" y="116" width="19" height="5" rx="1" fill="#3F78C2" stroke={LINE} strokeWidth="1.7" />
            <rect x="22" y="111" width="18" height="5" rx="1" fill="#D9482B" stroke={LINE} strokeWidth="1.7" />
            <rect x="20" y="106" width="19" height="5" rx="1" fill="#2FAE93" stroke={LINE} strokeWidth="1.7" />
            <circle cx="38" cy="123" r="4.2" fill={skin} stroke={LINE} strokeWidth="1.7" />
          </g>
        }
      />
      <g className="ch-garment">
        <path d="M44 63 Q60 67 76 63 L78 108 Q60 113 42 108Z" fill="#FAF6EC" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M43 98 L77 98 L86 154 Q60 161 34 154Z" fill="#2B3F8C" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M48 102 L43 156 M55 102 L52 158 M65 102 L68 158 M72 102 L77 156" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.7" />
        <path d="M55 64 L60 74 L65 64Z" fill="#fff" stroke={LINE} strokeWidth="1.7" />
        <path d="M60 73 L56.4 82 L60 80.4 L63.6 82Z" fill="#C8504A" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        <Shade d="M43 98 L77 98 L86 154 Q60 161 34 154Z" />
        <Shade d="M44 63 Q60 67 76 63 L78 108 Q60 113 42 108Z" />
      </g>
      <Neck skin={skin} />
      <Face skin={skin} hair={hair} lashes />
      <path
        d="M42 34 C40 16 50 8 60 8 C70 8 80 16 78 34 C76 26 71 21 66 20 L64.5 29 L59.5 20 L55 29 L52 21 C47 23 43.5 27 42 34Z"
        fill={hair}
        stroke={LINE}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M48 14 Q56 9.5 65 11" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  );
}

/* ---------- Woman in a saree ---------- */
function Woman({ skin }: { skin: string }) {
  const hair = '#2E2128';
  return (
    <>
      <circle cx="60" cy="9" r="8" fill={hair} stroke={LINE} strokeWidth="1.7" />
      <path d="M44 30 C42 40 44 52 48 60 L72 60 C76 52 78 40 76 30Z" fill={hair} opacity="0.9" />
      <Legs leg="#168F8E" shoe="#C9A24A" skin={skin} />
      <Arms
        sleeve="#C23A3A"
        skin={skin}
        sleeveEnd={84}
        left={
          <g>
            {[110, 112.6, 115.2].map((y) => (
              <ellipse key={y} cx="39.8" cy={y} rx="3.8" ry="1" fill="none" stroke="#D9B04A" strokeWidth="1.1" />
            ))}
          </g>
        }
        right={
          <g>
            {[110, 112.6, 115.2].map((y) => (
              <ellipse key={y} cx="80.2" cy={y} rx="3.8" ry="1" fill="none" stroke="#D9B04A" strokeWidth="1.1" />
            ))}
          </g>
        }
      />
      <g className="ch-garment">
        <path d="M44 63 Q60 67 76 63 L78 100 Q60 105 42 100Z" fill="#E6B58F" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M44 63 Q60 67 76 63 L77 84 Q60 89 43 84Z" fill="#C23A3A" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M41 98 L79 98 L86 188 Q60 195 34 188Z" fill="#168F8E" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M50 102 Q47 148 43 186 M60 102 L60 192 M70 102 Q73 148 77 186" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.2" fill="none" />
        <path d="M35 181 L85 181" stroke="#C8745A" strokeWidth="5" />
        <path d="M35 181 L85 181" stroke="#F0D79A" strokeWidth="1.7" strokeDasharray="3 2.4" />
        <Shade d="M41 98 L79 98 L86 188 Q60 195 34 188Z" />
        {/* pallu over the shoulder */}
        <path d="M45 64 L58 68 L80 112 L69 118 L42 88Z" fill="#168F8E" stroke={LINE} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M45 64 L42 88 M69 118 L80 112" stroke="#C8745A" strokeWidth="3" strokeLinecap="round" />
        <Shade d="M45 64 L58 68 L80 112 L69 118 L42 88Z" />
      </g>
      <Neck skin={skin} />
      <circle cx="43" cy="42" r="1.8" fill="#D9B04A" stroke={LINE} strokeWidth="1.7" />
      <circle cx="77" cy="42" r="1.8" fill="#D9B04A" stroke={LINE} strokeWidth="1.7" />
      <Face skin={skin} hair={hair} lashes />
      <path
        d="M42 34 C40 17 50 10 60 10 C70 10 80 17 78 34 C75 25 68 19.5 61 19.5 L58 28 L54.5 20.5 C48 22 44 27 42 34Z"
        fill={hair}
        stroke={LINE}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M48 15 Q56 11 64 12" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="24.5" r="1.5" fill="#C23B4A" />
      {[
        [51, 3],
        [56, 0.6],
        [62, 0.4],
        [68, 3],
        [70, 9],
        [50, 9],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="2.5" fill="#FFFBF0" stroke={LINE} strokeWidth="1.7" />
          <circle cx={x} cy={y} r="0.7" fill="#E9CF8A" />
        </g>
      ))}
    </>
  );
}

/** An open hand seen from the front. It grows to cover the screen at the end of the walk. */
export function Palm({ skin }: { skin: string }) {
  return (
    <svg viewBox="0 0 100 120" aria-hidden="true" focusable="false">
      <g stroke={LINE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill={skin}>
        <rect x="16" y="4" width="14" height="52" rx="7" transform="rotate(-8 23 30)" />
        <rect x="33" y="-4" width="15" height="62" rx="7.5" />
        <rect x="51" y="-2" width="15" height="60" rx="7.5" />
        <rect x="69" y="6" width="14" height="52" rx="7" transform="rotate(8 76 32)" />
        <path d="M14 70 C2 62 -2 48 6 44 C14 40 22 52 30 62Z" />
        <path d="M14 50 L86 50 C90 80 82 112 52 116 C26 116 10 96 14 50Z" />
      </g>
      <path d="M30 78 Q50 92 70 78" stroke={LINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M36 62 Q50 70 66 62" stroke={LINE} strokeOpacity="0.6" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
