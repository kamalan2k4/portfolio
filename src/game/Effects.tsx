import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BoxGeometry, CanvasTexture, Color, ConeGeometry, CylinderGeometry, type Group, type InstancedMesh, type Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, Quaternion, SphereGeometry, SRGBColorSpace, TorusGeometry, Vector3 } from "three";
import { useDispose } from "@/world/scene/useDispose";
import { body, fx } from "./fx";
import type { HeroId } from "./heroes";
import { rt } from "./state";

const UP = new Vector3(0, 1, 0);
const q = new Quaternion();
const dir = new Vector3();
const mid = new Vector3();

/** Stretches a unit-height cylinder (centred on the origin) between two points. */
function span(m: Object3D, a: Vector3, b: Vector3, radius: number) {
  dir.subVectors(b, a);
  const len = dir.length();
  m.position.copy(mid.addVectors(a, b).multiplyScalar(0.5));
  m.quaternion.copy(q.setFromUnitVectors(UP, dir.normalize()));
  m.scale.set(radius, len, radius);
}

function shieldTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  const rings = ["#b5121b", "#e9e9ee", "#b5121b", "#1f3b8f"];
  rings.forEach((col, i) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(256, 256, 256 - i * 52, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = "#f2f2f5";
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 40 : 100;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    g.lineTo(256 + Math.cos(a) * r, 256 + Math.sin(a) * r);
  }
  g.fill();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function Effects({ hero }: { hero: HeroId }) {
  const beams = useRef<(Mesh | null)[]>([]);
  const flashes = useRef<(Mesh | null)[]>([]);
  const blasts = useRef<(Group | null)[]>([]);
  const shards = useRef<InstancedMesh>(null);
  const web = useRef<Mesh>(null);
  const flames = useRef<(Mesh | null)[]>([]);
  const shield = useRef<Group>(null);

  const assets = useMemo(() => {
    const unitCyl = new CylinderGeometry(1, 1, 1, 8, 1, true);
    const cone = new ConeGeometry(1, 1, 10, 1, true).rotateX(Math.PI).translate(0, -0.5, 0);
    return {
      unitCyl,
      cone,
      sphere: new SphereGeometry(1, 16, 12),
      ring: new TorusGeometry(1, 0.06, 6, 40),
      shard: new BoxGeometry(0.25, 0.12, 0.35),
      shieldGeo: new CylinderGeometry(0.42, 0.42, 0.05, 40),
      beamMat: new MeshBasicMaterial({ color: new Color("#bff6ff").multiplyScalar(3), transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
      heavyMat: new MeshBasicMaterial({ color: new Color("#9ee8ff").multiplyScalar(4), transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
      fireMat: new MeshBasicMaterial({ color: new Color("#ff8a3d").multiplyScalar(3), transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
      shockMat: new MeshBasicMaterial({ color: new Color("#ffd7a0").multiplyScalar(2), transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
      flameMat: new MeshBasicMaterial({ color: new Color("#9fe6ff").multiplyScalar(3), transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
      webMat: new MeshBasicMaterial({ color: new Color("#f4f7ff").multiplyScalar(1.6), toneMapped: false }),
      shardMat: new MeshStandardMaterial({ color: "#3a3d45", roughness: 0.6, metalness: 0.5 }),
      shieldMat: new MeshStandardMaterial({ map: shieldTexture(), metalness: 0.7, roughness: 0.3 }),
      edgeMat: new MeshStandardMaterial({ color: "#b8bcc6", metalness: 0.9, roughness: 0.25 }),
    };
  }, []);
  // Per-instance materials (each fades on its own), created once.
  const pooled = useMemo(
    () => ({
      beams: fx.beams.map(() => assets.beamMat.clone()),
      fires: fx.blasts.map(() => assets.fireMat.clone()),
      shocks: fx.blasts.map(() => assets.shockMat.clone()),
    }),
    [assets],
  );
  useDispose(...Object.values(assets), assets.shieldMat.map, ...pooled.beams, ...pooled.fires, ...pooled.shocks);

  const o = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    const m = shards.current;
    if (!m) return;
    o.scale.setScalar(0);
    o.updateMatrix();
    for (let i = 0; i < fx.shards.length; i++) m.setMatrixAt(i, o.matrix);
    m.instanceMatrix.needsUpdate = true;
  }, [o]);

  useFrame(({ clock }) => {
    fx.beams.forEach((b, i) => {
      const m = beams.current[i];
      const f = flashes.current[i];
      if (!m || !f) return;
      const on = b.life > 0;
      m.visible = f.visible = on;
      if (!on) return;
      const k = b.life / b.max;
      span(m, b.from, b.to, (b.heavy ? 0.45 : 0.09) * (0.4 + k));
      (m.material as MeshBasicMaterial).opacity = k;
      f.position.copy(b.from);
      f.scale.setScalar((b.heavy ? 1.1 : 0.35) * (0.5 + k));
    });
    fx.blasts.forEach((e, i) => {
      const g = blasts.current[i];
      if (!g) return;
      g.visible = e.life > 0;
      if (!g.visible) return;
      const t = 1 - e.life;
      g.position.copy(e.pos);
      const fire = g.children[0] as Mesh;
      const shock = g.children[1] as Mesh;
      fire.scale.setScalar(e.power * (0.5 + t * 2.4));
      (fire.material as MeshBasicMaterial).opacity = e.life ** 3;
      shock.scale.setScalar(e.power * (0.6 + t * 7));
      shock.rotation.x = Math.PI / 2;
      (shock.material as MeshBasicMaterial).opacity = e.life * e.life * 0.6;
    });
    const sm = shards.current;
    if (sm) {
      fx.shards.forEach((s, i) => {
        if (s.life <= 0) o.scale.setScalar(0);
        else {
          o.position.copy(s.pos);
          o.rotation.set(s.spin * s.life, s.spin * 0.7 * s.life, 0);
          o.scale.setScalar(Math.min(1, s.life * 1.5));
        }
        o.updateMatrix();
        sm.setMatrixAt(i, o.matrix);
      });
      sm.instanceMatrix.needsUpdate = true;
    }
    if (web.current) {
      web.current.visible = fx.web.on && body.ready;
      if (web.current.visible) span(web.current, body.rightHand, fx.web.to, 0.025);
    }
    flames.current.forEach((f, i) => {
      if (!f) return;
      f.visible = hero === "ironman" && fx.thrust > 0.05 && body.ready;
      if (!f.visible) return;
      const flicker = 0.85 + 0.3 * Math.sin(clock.elapsedTime * 60 + i * 2.1);
      const len = (i < 2 ? 0.35 : 0.6) * fx.thrust * flicker;
      f.position.copy(body.thrusters[i]);
      f.quaternion.copy(q.setFromUnitVectors(UP, dir.copy(body.thrustDirs[i]).negate()));
      f.scale.set(i < 2 ? 0.07 : 0.1, len, i < 2 ? 0.07 : 0.1);
    });
    const sh = shield.current;
    if (sh) {
      sh.visible = hero === "cap" && body.ready;
      if (sh.visible) {
        const s = fx.shield;
        if (s.state === "held") {
          // Strapped to the left forearm, facing outward from the body.
          sh.position.copy(body.leftHand).lerp(body.chest, 0.15);
          sh.rotation.set(0, rt.yaw + Math.PI / 2, Math.PI / 2, "YXZ");
        } else {
          sh.position.copy(s.pos);
          sh.rotation.set(0.2, clock.elapsedTime * 22, 0);
        }
      }
    }
  });

  return (
    <group>
      {fx.beams.map((_, i) => (
        <group key={i}>
          <mesh ref={(m) => void (beams.current[i] = m)} geometry={assets.unitCyl} material={pooled.beams[i]} visible={false} frustumCulled={false} />
          <mesh ref={(m) => void (flashes.current[i] = m)} geometry={assets.sphere} material={assets.heavyMat} visible={false} frustumCulled={false} />
        </group>
      ))}
      {fx.blasts.map((_, i) => (
        <group key={i} ref={(g) => void (blasts.current[i] = g)} visible={false}>
          <mesh geometry={assets.sphere} material={pooled.fires[i]} frustumCulled={false} />
          <mesh geometry={assets.ring} material={pooled.shocks[i]} frustumCulled={false} />
        </group>
      ))}
      <instancedMesh ref={shards} args={[assets.shard, assets.shardMat, fx.shards.length]} frustumCulled={false} />
      <mesh ref={web} geometry={assets.unitCyl} material={assets.webMat} visible={false} frustumCulled={false} />
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(m) => void (flames.current[i] = m)} geometry={assets.cone} material={assets.flameMat} visible={false} frustumCulled={false} />
      ))}
      <group ref={shield} visible={false}>
        <mesh geometry={assets.shieldGeo} material={[assets.edgeMat, assets.shieldMat, assets.shieldMat]} />
      </group>
    </group>
  );
}
