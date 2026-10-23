import type { ReactNode } from "react";
import type { Project, VisualKind } from "@/content/types";

/**
 * Stylised concept illustration for a project, drawn as inline SVG so it costs
 * no image requests and tints itself with the project's accent colour.
 */
export function ProjectVisual({ project, className = "" }: { project: Pick<Project, "slug" | "accent" | "visual" | "title">; className?: string }) {
  const id = `pv-${project.slug}`;
  const a = project.accent;
  return (
    <svg
      viewBox="0 0 640 400"
      role="img"
      aria-label={`Concept illustration for ${project.title}`}
      className={`block h-auto w-full ${className}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={`${id}-bg`} cx="70%" cy="20%" r="90%">
          <stop offset="0" stopColor={a} stopOpacity="0.32" />
          <stop offset="0.55" stopColor="#0c1a15" stopOpacity="1" />
          <stop offset="1" stopColor="#07110d" />
        </radialGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ece6d6" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ece6d6" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id={`${id}-acc`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={a} stopOpacity="0.45" />
        </linearGradient>
        <pattern id={`${id}-grid`} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke="#ece6d6" strokeOpacity="0.05" />
        </pattern>
      </defs>
      <rect width="640" height="400" fill={`url(#${id}-bg)`} />
      <rect width="640" height="400" fill={`url(#${id}-grid)`} />
      {art[project.visual]({ id, a })}
    </svg>
  );
}

type ArtProps = { id: string; a: string };
const S = "#ece6d6";

const Glass = ({ id, x, y, w, h, r = 14 }: { id: string; x: number; y: number; w: number; h: number; r?: number }) => (
  <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${id}-glass)`} stroke={S} strokeOpacity="0.18" />
);
const Bar = ({ x, y, w, o = 0.25, h = 8 }: { x: number; y: number; w: number; o?: number; h?: number }) => (
  <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={S} fillOpacity={o} />
);

const art: Record<VisualKind, (p: ArtProps) => ReactNode> = {
  mobile: ({ id, a }) => (
    <g>
      <Glass id={id} x={92} y={40} w={190} h={340} r={30} />
      <rect x={160} y={52} width={54} height={8} rx={4} fill={S} fillOpacity="0.2" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(110 ${84 + i * 82})`} opacity={1 - i * 0.22}>
          <rect width="154" height="68" rx="14" fill="#0c1a15" stroke={i === 0 ? a : S} strokeOpacity={i === 0 ? 0.9 : 0.15} />
          <circle cx="20" cy="22" r="8" fill={a} fillOpacity={i === 0 ? 1 : 0.4} />
          <Bar x={36} y={17} w={80} o={0.5} />
          <Bar x={14} y={40} w={124} o={0.18} h={6} />
          <Bar x={14} y={52} w={92} o={0.18} h={6} />
        </g>
      ))}
      <g transform="translate(450 200)">
        <circle r="92" fill="none" stroke={S} strokeOpacity="0.08" strokeWidth="18" />
        <circle r="92" fill="none" stroke={`url(#${id}-acc)`} strokeWidth="18" strokeDasharray="420 600" strokeLinecap="round" transform="rotate(-90)" />
        <circle r="62" fill="none" stroke={S} strokeOpacity="0.08" strokeWidth="12" />
        <circle r="62" fill="none" stroke={a} strokeOpacity="0.55" strokeWidth="12" strokeDasharray="220 400" strokeLinecap="round" transform="rotate(-90)" />
        <text y="8" textAnchor="middle" fill={S} fontSize="26" fontWeight="700" fontFamily="sans-serif">Adapt</text>
      </g>
      <path d="M282 130 C 330 120, 340 170, 372 160" fill="none" stroke={a} strokeOpacity="0.6" strokeDasharray="4 6" />
    </g>
  ),
  dashboard: ({ id, a }) => (
    <g>
      <Glass id={id} x={48} y={40} w={544} h={320} />
      <rect x={48} y={40} width={120} height={320} rx={14} fill="#07110d" fillOpacity="0.5" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Bar key={i} x={68} y={76 + i * 30} w={i === 1 ? 80 : 64} o={i === 1 ? 0.7 : 0.2} />
      ))}
      <rect x={60} y={68} width={4} height={24} rx={2} fill={a} transform="translate(0 30)" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${188 + i * 132} 64)`}>
          <rect width="118" height="64" rx="10" fill="#0c1a15" stroke={S} strokeOpacity="0.12" />
          <Bar x={12} y={14} w={46} o={0.3} h={6} />
          <rect x="12" y="32" width={52 + i * 10} height="16" rx="4" fill={i === 0 ? a : S} fillOpacity={i === 0 ? 0.9 : 0.35} />
        </g>
      ))}
      {[46, 82, 64, 120, 96, 140, 112, 158].map((h, i) => (
        <rect key={i} x={196 + i * 28} y={300 - h} width="16" height={h} rx="4" fill={i === 7 ? a : S} fillOpacity={i === 7 ? 1 : 0.18} />
      ))}
      <polyline points="196,250 224,236 252,242 280,214 308,220 336,190 364,198 392,168" fill="none" stroke={a} strokeWidth="2.5" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(440 ${150 + i * 40})`}>
          <rect width="136" height="30" rx="8" fill="#0c1a15" stroke={S} strokeOpacity="0.1" />
          <circle cx="16" cy="15" r="5" fill={[a, S, a, S][i]} fillOpacity={i % 2 ? 0.35 : 0.9} />
          <Bar x={30} y={11} w={70 - i * 8} o={0.3} />
        </g>
      ))}
    </g>
  ),
  "desktop-companion": ({ id, a }) => (
    <g>
      <Glass id={id} x={70} y={50} w={500} h={290} r={16} />
      <rect x={70} y={312} width={500} height={28} rx={0} fill="#07110d" fillOpacity="0.7" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={250 + i * 36} y={318} width="24" height="16" rx="4" fill={S} fillOpacity={i === 2 ? 0.6 : 0.15} />
      ))}
      <rect x={290} y={346} width={60} height={18} fill={S} fillOpacity="0.1" />
      <path d="M90 90 C 220 40, 330 300, 430 210" fill="none" stroke={a} strokeOpacity="0.55" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" />
      <g transform="translate(440 160)">
        <path d="M0 -46 C 22 -14, 36 6, 36 26 a36 36 0 0 1 -72 0 C -36 6, -22 -14, 0 -46Z" fill={`url(#${id}-acc)`} />
        <rect x="-24" y="12" width="20" height="9" rx="4" fill="#07110d" />
        <rect x="4" y="12" width="20" height="9" rx="4" fill="#07110d" />
        <path d="M-10 36 q10 8 20 0" stroke="#07110d" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <g transform="translate(372 196)">
        <path d="M0 0 h26 l-4 40 h-18z" fill={S} fillOpacity="0.2" stroke={S} strokeOpacity="0.5" />
        <path d="M2 14 h22 l-3 26 h-16z" fill={a} fillOpacity="0.55" />
      </g>
      <g transform="translate(110 236)">
        <rect width="190" height="58" rx="12" fill="#07110d" stroke={a} strokeOpacity="0.6" />
        <Bar x={16} y={16} w={120} o={0.6} />
        <rect x="16" y="32" width="72" height="16" rx="8" fill={a} />
        <rect x="96" y="32" width="78" height="16" rx="8" fill="none" stroke={S} strokeOpacity="0.4" />
      </g>
    </g>
  ),
  pipeline: ({ id, a }) => (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${60 + i * 8} ${110 + i * 10})`}>
          <rect width="90" height="116" rx="8" fill="#0c1a15" stroke={S} strokeOpacity="0.25" />
          {[0, 1, 2, 3, 4].map((j) => (
            <Bar key={j} x={12} y={18 + j * 18} w={66 - (j % 2) * 18} o={0.2} h={6} />
          ))}
        </g>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={208} y={110 + i * 34} width="62" height="24" rx="6" fill={a} fillOpacity={0.25 + i * 0.12} />
      ))}
      <path d="M170 180 H200 M276 180 H310" stroke={S} strokeOpacity="0.35" strokeDasharray="3 5" />
      <g transform="translate(380 180)">
        <circle r="72" fill={a} fillOpacity="0.06" stroke={a} strokeOpacity="0.25" />
        {Array.from({ length: 26 }, (_, i) => {
          const t = i * 2.39996;
          const r = 10 + (i % 7) * 8.5;
          return <circle key={i} cx={Math.cos(t) * r} cy={Math.sin(t) * r} r={i % 5 === 0 ? 5 : 3} fill={i % 5 === 0 ? a : S} fillOpacity={i % 5 === 0 ? 1 : 0.35} />;
        })}
      </g>
      <path d="M452 180 H486" stroke={a} strokeWidth="2" />
      <Glass id={id} x={488} y={128} w={110} h={104} />
      <text x={543} y={168} textAnchor="middle" fill={a} fontSize="16" fontWeight="700" fontFamily="sans-serif">LLM</text>
      <Bar x={506} y={186} w={74} o={0.3} h={6} />
      <Bar x={506} y={200} w={54} o={0.3} h={6} />
      <g transform="translate(430 270)">
        <rect width="168" height="56" rx="14" fill="#07110d" stroke={a} strokeOpacity="0.7" />
        <Bar x={14} y={16} w={120} o={0.55} h={6} />
        <Bar x={14} y={30} w={96} o={0.3} h={6} />
        <rect x="118" y="38" width="38" height="10" rx="5" fill={a} fillOpacity="0.8" />
      </g>
    </g>
  ),
  canvas: ({ id, a }) => (
    <g>
      <Glass id={id} x={70} y={60} w={330} h={280} r={20} />
      <path d="M110 220 c 20 -60 40 -60 46 0 s 26 -80 40 -10 m 20 -30 h 40 m -20 -20 v 40 m 40 -10 c 10 -40 40 -40 40 0 c 0 30 -40 40 -40 0" fill="none" stroke={a} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="330" cy="270" r="9" fill={S} fillOpacity="0.6" />
      <path d="M410 200 H448" stroke={S} strokeOpacity="0.4" strokeDasharray="3 5" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={460 + (i % 3) * 38} y={140 + Math.floor(i / 3) * 38} width="30" height="30" rx="6" fill={a} fillOpacity={0.15 + i * 0.1} />
      ))}
      <g transform="translate(456 240)">
        <rect width="126" height="46" rx="10" fill="#07110d" stroke={a} />
        <text x="63" y="30" textAnchor="middle" fill={S} fontSize="20" fontFamily="monospace">n + 4 = 0</text>
      </g>
    </g>
  ),
  chat: ({ id, a }) => (
    <g>
      <Glass id={id} x={60} y={50} w={240} h={300} />
      <Glass id={id} x={340} y={50} w={240} h={300} />
      {[0, 1, 2, 3].map((i) => {
        const mine = i % 2 === 1;
        return (
          <g key={i}>
            <rect x={mine ? 160 : 78} y={84 + i * 56} width={120} height={36} rx={14} fill={mine ? a : S} fillOpacity={mine ? 0.85 : 0.12} />
            <rect x={mine ? 358 : 440} y={84 + i * 56} width={120} height={36} rx={14} fill={mine ? S : a} fillOpacity={mine ? 0.12 : 0.85} />
          </g>
        );
      })}
      <path d="M300 200 C 315 170, 325 230, 340 200" fill="none" stroke={a} strokeWidth="2.5" />
      <circle cx="320" cy="200" r="22" fill="none" stroke={a} strokeOpacity="0.35" />
      <circle cx="320" cy="200" r="36" fill="none" stroke={a} strokeOpacity="0.15" />
    </g>
  ),
  terminal: ({ id, a }) => (
    <g>
      <Glass id={id} x={60} y={50} w={380} h={300} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={84 + i * 18} cy={72} r="5" fill={S} fillOpacity="0.3" />
      ))}
      {["$ docker build -t task .", "$ ./solution/solve.sh", "  wrote /app/out.json", "$ pytest tests/", "  ✓ test_report_exists", "  ✓ test_counts_match", "  ✓ test_top_path"].map((l, i) => (
        <text key={i} x={84} y={112 + i * 30} fill={l.includes("✓") ? a : S} fillOpacity={l.startsWith("$") ? 0.9 : 0.65} fontSize="16" fontFamily="monospace">
          {l}
        </text>
      ))}
      {[0, 1, 2].map((r) =>
        [0, 1].map((c) => (
          <rect key={`${r}${c}`} x={470 + c * 56} y={120 + r * 56} width="46" height="46" rx="8" fill={a} fillOpacity={0.2 + (r + c) * 0.15} stroke={a} strokeOpacity="0.5" />
        )),
      )}
      <path d="M462 300 q 50 30 108 0" fill="none" stroke={S} strokeOpacity="0.3" strokeWidth="3" />
    </g>
  ),
  helix: ({ a }) => (
    <g>
      {Array.from({ length: 22 }, (_, i) => {
        const x = 60 + i * 24;
        const y1 = 200 + Math.sin(i * 0.55) * 90;
        const y2 = 200 - Math.sin(i * 0.55) * 90;
        return (
          <g key={i}>
            <line x1={x} y1={y1} x2={x} y2={y2} stroke={i % 3 ? S : a} strokeOpacity={i % 3 ? 0.18 : 0.6} strokeWidth="4" />
            <circle cx={x} cy={y1} r="7" fill={a} />
            <circle cx={x} cy={y2} r="7" fill={S} fillOpacity="0.7" />
          </g>
        );
      })}
      <text x="560" y="372" textAnchor="end" fill={S} fillOpacity="0.6" fontSize="16" fontFamily="monospace">AUG · GCU · UAA</text>
    </g>
  ),
  storefront: ({ id, a }) => (
    <g>
      <Glass id={id} x={60} y={44} w={520} h={312} />
      <rect x={60} y={44} width={520} height={34} rx={14} fill="#07110d" fillOpacity="0.6" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={80 + i * 16} cy={61} r="4.5" fill={S} fillOpacity="0.3" />
      ))}
      <Bar x={86} y={104} w={220} o={0.7} h={14} />
      <Bar x={86} y={130} w={170} o={0.25} />
      <rect x="86" y="152" width="96" height="28" rx="14" fill={a} />
      {["Uploaded", "Review", "Payment", "Done"].map((s, i) => (
        <g key={s} transform={`translate(${86 + i * 122} 214)`}>
          <rect width="106" height="112" rx="12" fill="#0c1a15" stroke={i === 1 ? a : S} strokeOpacity={i === 1 ? 0.9 : 0.15} />
          <path d="M18 18 h40 l14 14 v46 h-54z" fill={S} fillOpacity="0.12" stroke={S} strokeOpacity="0.3" />
          <rect x="18" y="86" width="70" height="14" rx="7" fill={i <= 1 ? a : S} fillOpacity={i <= 1 ? 0.8 : 0.2} />
          <text x="53" y="97" textAnchor="middle" fill="#07110d" fontSize="9" fontWeight="700" fontFamily="sans-serif">{s}</text>
        </g>
      ))}
      <g transform="translate(410 96)">
        <rect width="140" height="84" rx="12" fill="#07110d" stroke={S} strokeOpacity="0.2" />
        <path d="M30 56 l20 -24 l16 14 l22 -28 l22 20" fill="none" stroke={a} strokeWidth="3" strokeLinejoin="round" />
      </g>
    </g>
  ),
};
