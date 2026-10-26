import type { ReactNode } from 'react';

/**
 * Original anime-style characters, drawn as SVG. Every character is an invented person,
 * not taken from any existing film, series or game.
 * Parts are grouped (arm-l, arm-r, leg-l, leg-r) so CSS can make them walk and raise a hand.
 */
export type CharacterKind = 'msme' | 'farmer' | 'home' | 'student' | 'woman';

export const skinTones: Record<CharacterKind, string> = {
  msme: '#D99A6C',
  farmer: '#B8764B',
  home: '#E0AD82',
  student: '#D8A07A',
  woman: '#E3B088',
};

const OUT = '#2B1A33';

/** A thick rounded line with a dark outline, used for arms and legs. */
function Limb({ d, w, color }: { d: string; w: number; color: string }) {
  return (
    <>
      <path d={d} stroke={OUT} strokeWidth={w + 3} strokeLinecap="round" fill="none" />
      <path d={d} stroke={color} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  );
}

function Face({ skin, iris, brow, moustache }: { skin: string; iris: string; brow: string; moustache?: string }) {
  return (
    <g>
      <ellipse cx="34" cy="53" rx="4" ry="6" fill={skin} stroke={OUT} strokeWidth="1.6" />
      <ellipse cx="86" cy="53" rx="4" ry="6" fill={skin} stroke={OUT} strokeWidth="1.6" />
      <path
        d="M34 47 C34 27 46 21 60 21 C74 21 86 27 86 47 C86 66 75 80 60 80 C45 80 34 66 34 47Z"
        fill={skin}
        stroke={OUT}
        strokeWidth="1.8"
      />
      {[48.5, 71.5].map((cx, i) => (
        <g key={cx}>
          <ellipse cx={cx} cy="52" rx="7.6" ry="9.6" fill="#fff" stroke={OUT} strokeWidth="1" />
          <ellipse cx={cx} cy="53.5" rx="5.7" ry="8" fill={iris} />
          <ellipse cx={cx} cy="54" rx="2.8" ry="4.6" fill="#1A1020" />
          <circle cx={cx - 2.4} cy="49.2" r="2.3" fill="#fff" />
          <circle cx={cx + 2.2} cy="57.4" r="1.1" fill="#fff" />
          <path
            d={i === 0 ? 'M40.4 49 Q48.5 40.5 56.4 48.6' : 'M63.6 48.6 Q71.5 40.5 79.6 49'}
            stroke={OUT}
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
          />
          <path d={i === 0 ? 'M40.6 49 l-2.6 -2' : 'M79.4 49 l2.6 -2'} stroke={OUT} strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
      <path d="M41 39.5 Q48 35.5 55 38.5" stroke={brow} strokeWidth="2.3" fill="none" strokeLinecap="round" />
      <path d="M65 38.5 Q72 35.5 79 39.5" stroke={brow} strokeWidth="2.3" fill="none" strokeLinecap="round" />
      <path d="M59.4 61 q-1.6 3 1.2 3.6" stroke={OUT} strokeOpacity="0.5" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M53.5 69.5 Q60 76 66.5 69.5" stroke={OUT} strokeWidth="2" fill="#B8434F" strokeLinejoin="round" />
      <ellipse cx="40.5" cy="64" rx="5" ry="2.7" fill="#FF6F7F" opacity="0.38" />
      <ellipse cx="79.5" cy="64" rx="5" ry="2.7" fill="#FF6F7F" opacity="0.38" />
      {moustache ? (
        <path d="M49 67 Q55 61.5 60 65 Q65 61.5 71 67 Q65 66.8 60 67.6 Q55 66.8 49 67Z" fill={moustache} stroke={OUT} strokeWidth="1" />
      ) : null}
    </g>
  );
}

const Neck = ({ skin }: { skin: string }) => (
  <g>
    <rect x="53" y="76" width="14" height="14" rx="4" fill={skin} stroke={OUT} strokeWidth="1.6" />
    <path d="M53.8 79 Q60 86 66.2 79 L66.2 84 Q60 90 53.8 84Z" fill="#000" opacity="0.12" />
  </g>
);

/** Both legs. Skin or trouser colour, plus shoes (or bare feet). */
function Legs({ leg, sock, shoe, barefoot, skin }: { leg: string; sock?: string; shoe: string; barefoot?: boolean; skin: string }) {
  return (
    <>
      {[
        ['leg-l', 52],
        ['leg-r', 68],
      ].map(([cls, x]) => (
        <g key={cls} className={`ch-${cls}`} style={{ transformOrigin: `${x}px 138px` }}>
          <Limb d={`M${x} 140 L${x} 176`} w={13} color={leg} />
          {sock ? <Limb d={`M${x} 168 L${x} 180`} w={11} color={sock} /> : null}
          {barefoot ? (
            <ellipse cx={x} cy="190" rx="8.5" ry="4.6" fill={skin} stroke={OUT} strokeWidth="1.6" />
          ) : (
            <>
              <ellipse cx={x} cy="190" rx="10" ry="5.4" fill={shoe} stroke={OUT} strokeWidth="1.6" />
              <ellipse cx={x - 2} cy="188.4" rx="4" ry="1.6" fill="#fff" opacity="0.35" />
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
  sleeveLong = false,
  left,
  right,
}: {
  sleeve: string;
  skin: string;
  sleeveLong?: boolean;
  left?: ReactNode;
  right?: ReactNode;
}) {
  const forearmStart = sleeveLong ? 140 : 126;
  return (
    <>
      <g className="ch-arm-l" style={{ transformOrigin: '40px 92px' }}>
        <Limb d="M40 93 L33 133" w={9} color={skin} />
        <Limb d={`M40 93 L${40 - (7 * (forearmStart - 93)) / 40} ${forearmStart}`} w={12} color={sleeve} />
        <circle cx="32" cy="138" r="6" fill={skin} stroke={OUT} strokeWidth="1.6" />
        {left}
      </g>
      <g className="ch-arm-r" style={{ transformOrigin: '80px 92px' }}>
        <Limb d="M80 93 L87 133" w={9} color={skin} />
        <Limb d={`M80 93 L${80 + (7 * (forearmStart - 93)) / 40} ${forearmStart}`} w={12} color={sleeve} />
        <circle cx="88" cy="138" r="6" fill={skin} stroke={OUT} strokeWidth="1.6" />
        {right}
        <circle className="ch-hand" cx="88" cy="140" r="3" fill="none" />
      </g>
    </>
  );
}

export function Character({ kind, walking = false, raised = false }: { kind: CharacterKind; walking?: boolean; raised?: boolean }) {
  const skin = skinTones[kind];
  const cls = `ch${walking ? ' walking' : ''}${raised ? ' raised' : ''}`;
  return (
    <svg className={cls} viewBox="0 0 120 210" role="img" aria-hidden="true" focusable="false">
      <ellipse className="ch-shadow" cx="60" cy="198" rx="30" ry="5" fill="#000" opacity="0.14" />
      <g className="ch-body">
        {kind === 'msme' ? <Msme skin={skin} /> : null}
        {kind === 'farmer' ? <Farmer skin={skin} /> : null}
        {kind === 'home' ? <Home skin={skin} /> : null}
        {kind === 'student' ? <Student skin={skin} /> : null}
        {kind === 'woman' ? <Woman skin={skin} /> : null}
      </g>
    </svg>
  );
}

/* ---------- Shopkeeper / small business owner ---------- */
function Msme({ skin }: { skin: string }) {
  const hair = '#1B1424';
  return (
    <>
      <Legs leg="#F1E6CF" shoe="#7A4528" skin={skin} />
      <Arms
        sleeve="#F2B134"
        skin={skin}
        sleeveLong
        left={
          <g transform="rotate(-8 24 140)">
            <rect x="12" y="124" width="24" height="30" rx="2.5" fill="#C0392B" stroke={OUT} strokeWidth="1.6" />
            <rect x="15" y="124" width="2.5" height="30" fill="#8E2A20" />
            <rect x="20" y="130" width="12" height="3" rx="1.5" fill="#F7D774" />
            <rect x="20" y="136" width="9" height="2.4" rx="1.2" fill="#F7D774" />
            <circle cx="33" cy="146" r="6" fill={skin} stroke={OUT} strokeWidth="1.6" />
          </g>
        }
      />
      <g className="ch-garment">
        <path d="M39 86 Q60 93 81 86 L87 152 Q60 159 33 152Z" fill="#F2B134" stroke={OUT} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M39 86 L53 90 L55 154 L34 152Z" fill="#27366E" stroke={OUT} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M81 86 L67 90 L65 154 L86 152Z" fill="#27366E" stroke={OUT} strokeWidth="1.6" strokeLinejoin="round" />
        {[102, 114, 126, 138].map((y) => (
          <circle key={y} cx="60" cy={y} r="1.9" fill="#F7D774" stroke={OUT} strokeWidth="0.8" />
        ))}
        <path d="M54 86 Q60 96 66 86" stroke={OUT} strokeWidth="1.6" fill="#F2B134" />
      </g>
      <Neck skin={skin} />
      <Face skin={skin} iris="#5A3B2B" brow={hair} />
      <path
        d="M33 47 C31 26 44 13 60 14 C77 13 89 26 87 47 C85 37 81 33 75 31 L71 37 L65 29 L59 36 L53 29 L47 37 C41 33 36 38 33 47Z"
        fill={hair}
        stroke={OUT}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M44 22 Q52 17 60 18" stroke="#fff" strokeOpacity="0.28" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  );
}

/* ---------- Farmer ---------- */
function Farmer({ skin }: { skin: string }) {
  const hair = '#1B1424';
  return (
    <>
      <Legs leg={skin} shoe="#000" barefoot skin={skin} />
      <Arms
        sleeve="#F7F3EA"
        skin={skin}
        sleeveLong
        left={
          <g transform="rotate(-6 26 140)">
            {[-8, -4, 0, 4, 8].map((o) => (
              <g key={o}>
                <path d={`M${28 + o} 150 L${22 + o * 1.6} 112`} stroke="#C99A2E" strokeWidth="1.6" strokeLinecap="round" />
                <ellipse cx={22 + o * 1.6} cy="110" rx="2.3" ry="5" fill="#F2C94C" stroke={OUT} strokeWidth="0.9" transform={`rotate(${o * 2} ${22 + o * 1.6} 110)`} />
              </g>
            ))}
            <circle cx="30" cy="141" r="6" fill={skin} stroke={OUT} strokeWidth="1.6" />
            <path d="M22 146 L38 146" stroke="#D64545" strokeWidth="3" strokeLinecap="round" />
          </g>
        }
      />
      <g className="ch-garment">
        <path d="M39 86 Q60 93 81 86 L85 146 Q60 152 35 146Z" fill="#F7F3EA" stroke={OUT} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M60 92 L60 146" stroke={OUT} strokeOpacity="0.35" strokeWidth="1.2" />
        <path d="M44 108 Q50 112 52 124 M76 108 Q70 112 68 124" stroke={OUT} strokeOpacity="0.18" strokeWidth="1.6" fill="none" />
        {/* gamchha (towel) over the shoulder */}
        <path d="M68 87 L84 94 L88 128 L78 130 L74 108Z" fill="#D64545" stroke={OUT} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M72 96 L85 101 M74 106 L86 111 M75 116 L87 121" stroke="#fff" strokeOpacity="0.75" strokeWidth="1.6" />
        {/* dhoti */}
        <path d="M38 138 L82 138 L88 190 Q60 196 32 190Z" fill="#FFFFFF" stroke={OUT} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M50 142 Q48 166 44 188 M60 142 L60 192 M70 142 Q72 166 76 188" stroke={OUT} strokeOpacity="0.28" strokeWidth="1.4" fill="none" />
        <path d="M33 184 L87 184" stroke="#E4572E" strokeWidth="3" />
      </g>
      <Neck skin={skin} />
      <Face skin={skin} iris="#3B2418" brow={hair} moustache={hair} />
      {/* turban */}
      <path
        d="M31 42 C30 18 45 6 60 6 C77 6 90 18 89 42 C80 33 70 30 60 30 C50 30 40 33 31 42Z"
        fill="#F08A24"
        stroke={OUT}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M36 36 C46 24 74 24 84 36 M33 28 C46 14 74 14 87 28 M40 18 C52 10 68 10 80 18" stroke="#FFD08A" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M86 26 Q104 34 98 58 Q96 46 90 42" fill="#F08A24" stroke={OUT} strokeWidth="1.6" strokeLinejoin="round" />
    </>
  );
}

/* ---------- Home seeker / house owner ---------- */
function Home({ skin }: { skin: string }) {
  const hair = '#2A1B14';
  return (
    <>
      <Legs leg="#3A56C8" shoe="#FFFFFF" skin={skin} />
      <Arms
        sleeve="#17A2A4"
        skin={skin}
        left={
          <g transform="rotate(-6 24 138)">
            <rect x="9" y="126" width="26" height="18" rx="1.5" fill="#FFF1D6" stroke={OUT} strokeWidth="1.6" />
            <path d="M5 128 L22 111 L39 128Z" fill="#D94A3B" stroke={OUT} strokeWidth="1.6" strokeLinejoin="round" />
            <rect x="18" y="134" width="7" height="10" rx="1" fill="#8A5A36" stroke={OUT} strokeWidth="1" />
            <rect x="11.5" y="130" width="5" height="5" fill="#9ED8F0" stroke={OUT} strokeWidth="0.9" />
            <rect x="27" y="130" width="5" height="5" fill="#9ED8F0" stroke={OUT} strokeWidth="0.9" />
            <circle cx="35" cy="142" r="6" fill={skin} stroke={OUT} strokeWidth="1.6" />
          </g>
        }
        right={
          <g>
            <circle cx="95" cy="146" r="3.4" fill="none" stroke="#E5B93A" strokeWidth="1.8" />
            <path d="M95 149.4 L95 160 M95 156 l3 0 M95 159 l2.4 0" stroke="#E5B93A" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        }
      />
      <g className="ch-garment">
        <path d="M39 86 Q60 93 81 86 L83 142 Q60 148 37 142Z" fill="#17A2A4" stroke={OUT} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M52 86 L60 100 L68 86Z" fill="#fff" stroke={OUT} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M60 100 L60 142" stroke={OUT} strokeOpacity="0.35" strokeWidth="1.2" />
        <path d="M38 138 L82 138 L83 150 Q60 156 37 150Z" fill="#2F46A8" stroke={OUT} strokeWidth="1.6" />
        <rect x="54" y="139" width="12" height="9" rx="1.5" fill="#E5B93A" stroke={OUT} strokeWidth="1" />
      </g>
      <Neck skin={skin} />
      <Face skin={skin} iris="#1C8F9A" brow={hair} />
      <path
        d="M32 48 C29 27 41 13 60 13 C79 13 91 27 88 48 C87 40 83 34 79 32 L82 23 L71 29 L67 18 L60 29 L53 18 L49 29 L38 23 L41 32 C37 35 33 41 32 48Z"
        fill={hair}
        stroke={OUT}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M46 22 Q54 17 62 19" stroke="#8A5A46" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </>
  );
}

/* ---------- Student ---------- */
function Student({ skin }: { skin: string }) {
  const hair = '#1B1424';
  return (
    <>
      {/* braids behind */}
      {[1, -1].map((s) => (
        <g key={s}>
          <path
            d={`M${60 - 25 * s} 52 C${60 - 36 * s} 70 ${60 - 40 * s} 96 ${60 - 36 * s} 118`}
            stroke={OUT}
            strokeWidth="12.5"
            strokeLinecap="round"
            fill="none"
          />
          <path d={`M${60 - 25 * s} 52 C${60 - 36 * s} 70 ${60 - 40 * s} 96 ${60 - 36 * s} 118`} stroke={hair} strokeWidth="9.5" strokeLinecap="round" fill="none" />
          <path
            d={`M${60 - 31 * s} 70 l${6 * s} 3 M${60 - 34 * s} 82 l${6 * s} 3 M${60 - 36 * s} 94 l${6 * s} 3 M${60 - 37 * s} 106 l${6 * s} 3`}
            stroke="#fff"
            strokeOpacity="0.22"
            strokeWidth="1.6"
          />
          <circle cx={60 - 36 * s} cy="120" r="4" fill="#D93F3F" stroke={OUT} strokeWidth="1.2" />
        </g>
      ))}
      <Legs leg={skin} sock="#FFFFFF" shoe="#1E1E2A" skin={skin} />
      <Arms
        sleeve="#FFFFFF"
        skin={skin}
        left={
          <g transform="rotate(-4 28 140)">
            <rect x="12" y="128" width="26" height="6.5" rx="1.2" fill="#3C79D8" stroke={OUT} strokeWidth="1.2" />
            <rect x="13.5" y="121.5" width="24" height="6.5" rx="1.2" fill="#E4572E" stroke={OUT} strokeWidth="1.2" />
            <rect x="11" y="115" width="25" height="6.5" rx="1.2" fill="#2EAD6B" stroke={OUT} strokeWidth="1.2" />
            <circle cx="33" cy="140" r="6" fill={skin} stroke={OUT} strokeWidth="1.6" />
          </g>
        }
      />
      <g className="ch-garment">
        <path d="M39 86 Q60 93 81 86 L83 128 Q60 134 37 128Z" fill="#FFFFFF" stroke={OUT} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M44 88 L48 128 M76 88 L72 128" stroke="#C9202C" strokeWidth="4.5" strokeLinecap="round" opacity="0.9" />
        <path d="M37 112 L83 112 L90 168 Q60 176 30 168Z" fill="#243B7A" stroke={OUT} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M46 116 L42 170 M54 116 L52 172 M66 116 L68 172 M74 116 L78 170" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.4" />
        <path d="M53 86 L60 98 L67 86Z" fill="#fff" stroke={OUT} strokeWidth="1.2" />
        <path d="M60 97 L55 108 L60 106 L65 108Z" fill="#D93F3F" stroke={OUT} strokeWidth="1.2" strokeLinejoin="round" />
      </g>
      <Neck skin={skin} />
      <Face skin={skin} iris="#5B3A8A" brow={hair} />
      <path
        d="M32 48 C31 25 45 12 60 12 C76 12 90 25 88 48 C85 38 79 30 69 27 C67 34 63 37 58 37 C52 37 46 33 42 28 C38 32 34 38 32 48Z"
        fill={hair}
        stroke={OUT}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M44 20 Q52 15 61 16" stroke="#fff" strokeOpacity="0.3" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M33 24 Q60 6 87 24" stroke="#D93F3F" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0" />
    </>
  );
}

/* ---------- Woman in a saree ---------- */
function Woman({ skin }: { skin: string }) {
  const hair = '#1B1424';
  return (
    <>
      <path
        d="M31 42 C27 18 44 10 60 10 C77 10 93 18 89 42 L93 124 Q83 138 70 128 L50 128 Q37 138 27 124Z"
        fill={hair}
        stroke={OUT}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Legs leg="#1F8A5B" shoe="#E5B93A" skin={skin} />
      <Arms
        sleeve="#A8235A"
        skin={skin}
        left={
          <g>
            {[132, 135.4, 138.8].map((y) => (
              <ellipse key={y} cx="32.6" cy={y} rx="5.2" ry="1.4" fill="none" stroke="#E5B93A" strokeWidth="1.5" />
            ))}
          </g>
        }
        right={
          <g>
            {[132, 135.4, 138.8].map((y) => (
              <ellipse key={y} cx="87.4" cy={y} rx="5.2" ry="1.4" fill="none" stroke="#E5B93A" strokeWidth="1.5" />
            ))}
          </g>
        }
      />
      <g className="ch-garment">
        <path d="M39 86 Q60 93 81 86 L82 118 Q60 124 38 118Z" fill="#E3B088" stroke={OUT} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M39 86 Q60 93 81 86 L81 108 Q60 114 39 108Z" fill="#A8235A" stroke={OUT} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M37 116 L83 116 L91 192 Q60 199 29 192Z" fill="#1F8A5B" stroke={OUT} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M48 120 Q45 158 41 190 M58 120 L57 194 M68 120 Q71 158 76 190" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.6" fill="none" />
        <path d="M30 184 L90 184" stroke="#E5B93A" strokeWidth="5" />
        <path d="M30 184 L90 184" stroke="#A8235A" strokeWidth="1.4" strokeDasharray="3 2.4" />
        {/* pallu across the body */}
        <path d="M41 87 L58 92 L84 134 L72 140 L40 108Z" fill="#1F8A5B" stroke={OUT} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M41 87 L40 108 M72 140 L84 134" stroke="#E5B93A" strokeWidth="3.4" strokeLinecap="round" />
      </g>
      <Neck skin={skin} />
      <Face skin={skin} iris="#4B2A1A" brow={hair} />
      <circle cx="34" cy="62" r="2.6" fill="#E5B93A" stroke={OUT} strokeWidth="0.9" />
      <circle cx="86" cy="62" r="2.6" fill="#E5B93A" stroke={OUT} strokeWidth="0.9" />
      <path
        d="M32 48 C31 26 46 13 60 13 C74 13 89 26 88 48 C84 36 75 28 60 28 C45 28 36 36 32 48Z"
        fill={hair}
        stroke={OUT}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M45 21 Q53 16 62 17" stroke="#fff" strokeOpacity="0.3" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="40" r="2.3" fill="#D6244A" />
      {/* jasmine flowers */}
      {[
        [78, 24],
        [83, 29],
        [86, 36],
        [73, 20],
        [88, 44],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="3.2" fill="#fff" stroke={OUT} strokeWidth="0.9" />
          <circle cx={x} cy={y} r="1" fill="#F2C94C" />
        </g>
      ))}
    </>
  );
}

/** An open hand seen from the front. It grows to cover the screen at the end of the walk. */
export function Palm({ skin }: { skin: string }) {
  return (
    <svg viewBox="0 0 100 120" aria-hidden="true" focusable="false">
      <g stroke={OUT} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" fill={skin}>
        <rect x="16" y="4" width="14" height="52" rx="7" transform="rotate(-8 23 30)" />
        <rect x="33" y="-4" width="15" height="62" rx="7.5" />
        <rect x="51" y="-2" width="15" height="60" rx="7.5" />
        <rect x="69" y="6" width="14" height="52" rx="7" transform="rotate(8 76 32)" />
        <path d="M14 70 C2 62 -2 48 6 44 C14 40 22 52 30 62Z" />
        <path d="M14 50 L86 50 C90 80 82 112 52 116 C26 116 10 96 14 50Z" />
      </g>
      <path d="M30 78 Q50 92 70 78" stroke={OUT} strokeOpacity="0.35" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M36 62 Q50 70 66 62" stroke={OUT} strokeOpacity="0.25" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
