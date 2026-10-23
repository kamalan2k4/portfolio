"use client";

/**
 * Architecture kit: a shared material library plus static batching.
 * Districts describe their static parts as data; parts sharing a material are merged
 * into one geometry, so a whole district costs a handful of draw calls.
 */
import type { ThreeElements } from "@react-three/fiber";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import {
  BoxGeometry,
  type BufferGeometry,
  Color,
  CylinderGeometry,
  Euler,
  type Material,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// ---------- materials ----------
export type MaterialKey = "stone" | "stoneAlt" | "stoneLight" | "path" | "metal" | "dark" | `glass:${string}` | `glow:${string}`;

class MaterialLibrary {
  private cache = new Map<string, Material>();
  get(key: MaterialKey): Material {
    let m = this.cache.get(key);
    if (m) return m;
    if (key.startsWith("glass:")) {
      m = new MeshStandardMaterial({ color: key.slice(6), transparent: true, opacity: 0.45, roughness: 0.06, metalness: 0.25, envMapIntensity: 1.4, depthWrite: false });
    } else if (key.startsWith("glow:")) {
      m = new MeshBasicMaterial({ color: new Color(key.slice(5)).multiplyScalar(1.6), toneMapped: false });
    } else {
      const spec: Record<string, [string, number, number]> = {
        stone: ["#d9cfba", 0.82, 0],
        stoneAlt: ["#c9bea4", 0.86, 0],
        stoneLight: ["#efe8d6", 0.7, 0],
        path: ["#cfc2a4", 0.9, 0],
        metal: ["#e9e2cf", 0.35, 0.4],
        dark: ["#24332e", 0.4, 0.2],
      };
      const [color, roughness, metalness] = spec[key];
      m = new MeshStandardMaterial({ color, roughness, metalness });
    }
    this.cache.set(key, m);
    return m;
  }
  dispose() {
    for (const m of this.cache.values()) m.dispose();
    this.cache.clear();
  }
}

const MaterialsContext = createContext<MaterialLibrary | null>(null);

export function MaterialsProvider({ children }: { children: ReactNode }) {
  const lib = useMemo(() => new MaterialLibrary(), []);
  useEffect(() => () => lib.dispose(), [lib]);
  return <MaterialsContext.Provider value={lib}>{children}</MaterialsContext.Provider>;
}

export function useMaterial(key: MaterialKey) {
  const lib = useContext(MaterialsContext);
  if (!lib) throw new Error("useMaterial outside MaterialsProvider");
  return lib.get(key);
}

// ---------- parts ----------
export type Part = { geo: BufferGeometry; mat: MaterialKey };
type T = { p?: [number, number, number]; r?: [number, number, number]; s?: [number, number, number] };

const m4 = new Matrix4();
const q = new Quaternion();
function place(geo: BufferGeometry, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] }: T) {
  q.setFromEuler(new Euler(r[0], r[1], r[2]));
  geo.applyMatrix4(m4.compose(new Vector3(...p), q, new Vector3(...s)));
  return geo;
}

export const part = {
  box: (mat: MaterialKey, size: [number, number, number], t: T = {}): Part => ({ mat, geo: place(new BoxGeometry(...size), t) }),
  cyl: (mat: MaterialKey, rt: number, rb: number, h: number, seg: number, t: T = {}, open = false): Part => ({ mat, geo: place(new CylinderGeometry(rt, rb, h, seg, 1, open), t) }),
  torus: (mat: MaterialKey, r: number, tube: number, arc = Math.PI * 2, t: T = {}, seg = 48): Part => ({ mat, geo: place(new TorusGeometry(r, tube, 8, seg, arc), t) }),
  sphere: (mat: MaterialKey, r: number, t: T = {}, w = 24, h = 16, phiLen = Math.PI * 2, thetaLen = Math.PI): Part => ({ mat, geo: place(new SphereGeometry(r, w, h, 0, phiLen, 0, thetaLen), t) }),
  octa: (mat: MaterialKey, r: number, t: T = {}): Part => ({ mat, geo: place(new OctahedronGeometry(r), t) }),
  plane: (mat: MaterialKey, w: number, h: number, t: T = {}): Part => ({ mat, geo: place(new PlaneGeometry(w, h), t) }),
};

/** Arrange n copies around a circle; `make` receives angle and index. */
export function ring<P>(n: number, make: (a: number, i: number) => P, offset = 0): P[] {
  return Array.from({ length: n }, (_, i) => make(offset + (i / n) * Math.PI * 2, i));
}

/** Merges parts by material and renders one mesh per material. */
export function Batch({ parts, shadows, ...group }: { parts: Part[]; shadows: boolean } & ThreeElements["group"]) {
  const lib = useContext(MaterialsContext)!;
  const merged = useMemo(() => {
    const groups = new Map<MaterialKey, BufferGeometry[]>();
    for (const p of parts) {
      const g = p.geo.index ? p.geo.toNonIndexed() : p.geo;
      if (g !== p.geo) p.geo.dispose();
      if (g.hasAttribute("uv")) g.deleteAttribute("uv");
      groups.set(p.mat, [...(groups.get(p.mat) ?? []), g]);
    }
    return [...groups].map(([mat, geos]) => {
      const geo = mergeGeometries(geos)!;
      for (const g of geos) g.dispose();
      geo.computeBoundingSphere();
      return { mat, geo };
    });
  }, [parts]);
  useEffect(() => () => merged.forEach((m) => m.geo.dispose()), [merged]);
  return (
    <group {...group}>
      {merged.map(({ mat, geo }) => {
        const transparent = mat.startsWith("glass:") || mat.startsWith("glow:");
        return <mesh key={mat} geometry={geo} material={lib.get(mat)} castShadow={shadows && !transparent} receiveShadow={shadows && !transparent} />;
      })}
    </group>
  );
}
