import type { Project } from "@/content/types";

const LANES = ["Clients", "Edge & API", "Services", "Data & external"];
const COL_W = 230;
const NODE_W = 178;
const NODE_H = 54;
const ROW_H = 78;
const PAD_TOP = 46;

/** Lane-based architecture diagram generated from a project's node/edge data. */
export function ArchitectureDiagram({ project }: { project: Project }) {
  const { nodes, edges } = project.architecture;
  const rows = new Map<number, number>();
  const pos = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const r = rows.get(n.lane) ?? 0;
    rows.set(n.lane, r + 1);
    pos.set(n.id, { x: 16 + n.lane * COL_W, y: PAD_TOP + r * ROW_H });
  }
  const maxRows = Math.max(...rows.values());
  const height = PAD_TOP + maxRows * ROW_H;
  const width = 16 + 3 * COL_W + NODE_W + 16;
  const marker = `arrow-${project.slug}`;
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <figure className="m-0">
      <div tabIndex={0} role="region" aria-label={`${project.title} architecture diagram (scrollable)`} className="overflow-x-auto rounded-xl border border-line bg-night/60">
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto min-w-[640px] w-full" role="img" aria-labelledby={`${marker}-title`}>
          <title id={`${marker}-title`}>{`${project.title} architecture`}</title>
          <defs>
            <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10z" fill={project.accent} />
            </marker>
          </defs>
          {LANES.map((l, i) => (
            <text key={l} x={16 + i * COL_W} y={24} fill="#8fa39a" fontSize="11" letterSpacing="1.5" fontFamily="monospace">
              {l.toUpperCase()}
            </text>
          ))}
          {edges.map((e, i) => {
            const a = pos.get(e.from)!;
            const b = pos.get(e.to)!;
            const forward = b.x > a.x;
            const same = b.x === a.x;
            const x1 = same ? a.x + NODE_W : forward ? a.x + NODE_W : a.x;
            const x2 = same ? b.x + NODE_W : forward ? b.x : b.x + NODE_W;
            const y1 = a.y + NODE_H / 2;
            const y2 = b.y + NODE_H / 2;
            const bend = same ? 40 : (x2 - x1) * 0.45;
            const d = same
              ? `M${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 + bend} ${y2}, ${x2} ${y2}`
              : `M${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
            return (
              <g key={i}>
                <path d={d} fill="none" stroke={project.accent} strokeOpacity="0.55" strokeWidth="1.6" markerEnd={`url(#${marker})`} />
                {e.label && (
                  <text x={(x1 + x2) / 2 + (same ? 44 : 0)} y={(y1 + y2) / 2 - 5} textAnchor="middle" fill="#ece6d6" fillOpacity="0.75" fontSize="10.5" fontFamily="monospace">
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
          {nodes.map((n) => {
            const p = pos.get(n.id)!;
            return (
              <g key={n.id} transform={`translate(${p.x} ${p.y})`}>
                <rect width={NODE_W} height={NODE_H} rx="10" fill="#0c1a15" stroke="#ece6d6" strokeOpacity="0.2" />
                <rect width="3" height={NODE_H - 20} x="0" y="10" rx="1.5" fill={project.accent} />
                <text x="14" y={n.detail ? 23 : 32} fill="#ece6d6" fontSize="13" fontWeight="600" fontFamily="sans-serif">
                  {n.label}
                </text>
                {n.detail && (
                  <text x="14" y="41" fill="#b9b3a3" fontSize="10.5" fontFamily="sans-serif">
                    {n.detail}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="sr-only">
        <ul>
          {edges.map((e, i) => (
            <li key={i}>
              {byId.get(e.from)?.label} to {byId.get(e.to)?.label}
              {e.label ? ` (${e.label})` : ""}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
