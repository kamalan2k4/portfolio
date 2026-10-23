"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { destinations } from "@/content/destinations";
import { QUALITY, stepDown } from "./quality";
import { AirTaxis } from "./scene/AirTaxis";
import { Forest } from "./scene/Forest";
import { LabelProjector } from "./scene/Labels";
import { MaterialsProvider } from "./scene/kit";
import { ArrivalGate, Beacon, Citadel, DistrictMarker, Nexus } from "./scene/Landmarks";
import { Nova } from "./scene/Nova";
import { COLORS, SUN_DIR } from "./scene/palette";
import { Player } from "./scene/Player";
import { Sky } from "./scene/Sky";
import { Terrain, Walkways } from "./scene/Terrain";
import { River, Waterfall } from "./scene/Water";
import { useWorld } from "./store";

const BUILT = new Set(["arrival", "nexus", "citadel"]);

/** Signals readiness after the first frames render, and freezes the static shadow map. */
function FrameGate({ shadows }: { shadows: boolean }) {
  const get = useThree((s) => s.get);
  const frames = useRef(0);
  const [compiled, setCompiled] = useState(false);
  // Compile every shader up front, in parallel where KHR_parallel_shader_compile exists,
  // so the main thread stays responsive and the first visible frame doesn't hitch.
  useEffect(() => {
    let alive = true;
    const { gl, scene, camera } = get();
    performance.mark("world:compile-start");
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        performance.mark("world:compiled");
        if (alive) setCompiled(true);
      });
    return () => {
      alive = false;
    };
  }, [get]);
  useEffect(() => {
    frames.current = 0;
    get().gl.shadowMap.autoUpdate = true;
  }, [get, shadows]);
  useFrame(({ gl, scene }) => {
    if (!compiled) return;
    frames.current++;
    if (frames.current === 3) {
      if (shadows) {
        // Scenery never moves, so render the shadow map once and reuse it.
        gl.shadowMap.autoUpdate = false;
        gl.shadowMap.needsUpdate = true;
      }
      if (!useWorld.getState().ready) {
        const { render, memory } = gl.info;
        let objects = 0;
        scene.traverse(() => void objects++);
        useWorld.getState().setReady({
          drawCalls: render.calls,
          triangles: render.triangles,
          geometries: memory.geometries,
          textures: memory.textures,
          programs: gl.info.programs?.length ?? 0,
          objects,
          quality: useWorld.getState().quality,
        });
      }
    }
  });
  return null;
}

export default function World() {
  const quality = useWorld((s) => s.quality);
  const reducedMotion = useWorld((s) => s.reducedMotion);
  const q = QUALITY[quality];
  const animate = !reducedMotion;
  const sun = SUN_DIR.clone().multiplyScalar(120);

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={q.dpr}
      shadows={q.shadows ? "percentage" : false}
      gl={{ antialias: q.antialias, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 62, near: 0.1, far: 1400, position: [0, 6, 58] }}
      aria-hidden
    >
      <PerformanceMonitor
        flipflops={2}
        onDecline={() => {
          const s = useWorld.getState();
          if (s.quality !== "low") s.setQuality(stepDown(s.quality));
        }}
      />
      <fog attach="fog" args={[COLORS.fog, 80, 330]} />
      <hemisphereLight args={[COLORS.hemiSky, COLORS.hemiGround, 1.25]} />
      <directionalLight
        position={[sun.x, sun.y, sun.z]}
        intensity={3}
        color={COLORS.sun}
        castShadow={q.shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0008}
        shadow-normalBias={0.12}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-camera-near={10}
        shadow-camera-far={320}
      />

      <MaterialsProvider>
      <Sky />
      <Terrain segments={q.terrainSegments} shadows={q.shadows} />
      <Walkways shadows={q.shadows} />
      <River animate={animate} />
      <Waterfall />
      <Forest trees={q.trees} rocks={q.rocks} shadows={q.shadows} animate={animate} />

      <ArrivalGate shadows={q.shadows} />
      <Nexus shadows={q.shadows} />
      <Citadel shadows={q.shadows} />
      {destinations
        .filter((d) => !BUILT.has(d.id))
        .map((d) => (
          <DistrictMarker key={d.id} id={d.id} shadows={q.shadows} />
        ))}
      {destinations
        .filter((d) => d.id !== "nexus" && d.id !== "arrival")
        .map((d) => (
          <Beacon key={d.id} id={d.id} />
        ))}
      <AirTaxis animate={animate} />
      <Nova />

      <Player />
      <LabelProjector />
      <FrameGate shadows={q.shadows} />
      </MaterialsProvider>
    </Canvas>
  );
}
