"use client";

import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { MaterialsProvider } from "@/world/scene/kit";
import { CityDistricts } from "./city/CityDistricts";
import { Buildings } from "./city/Buildings";
import { Ground, Harbor, ParkTrees, Seawall, StreetLights } from "./city/Ground";
import { NightSky } from "./city/NightSky";
import { MOON_DIR, NIGHT } from "./city/palette";
import { AviationLights, NeonSigns, PortfolioBillboards } from "./city/Signage";
import { Effects } from "./Effects";
import { HeroAvatar } from "./HeroAvatar";
import { HeroController } from "./HeroController";
import { HEROES } from "./heroes";
import { useEnvironment } from "./rig/model";
import { useGame } from "./state";
import { Traffic } from "./Traffic";

export type GameQuality = { dpr: [number, number]; antialias: boolean; texScale: number; bloom: boolean };

/** Compiles shaders up front, then reports readiness after the first frames render. */
function ReadyGate({ onReady }: { onReady: () => void }) {
  const get = useThree((s) => s.get);
  const frames = useRef(0);
  const [compiled, setCompiled] = useState(false);
  useEffect(() => {
    let alive = true;
    const { gl, scene, camera } = get();
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => alive && setCompiled(true));
    return () => {
      alive = false;
    };
  }, [get]);
  useFrame(({ gl }) => {
    if (!compiled) return;
    if (++frames.current === 3) {
      performance.mark("game:ready", { detail: { drawCalls: gl.info.render.calls, triangles: gl.info.render.triangles, programs: gl.info.programs?.length ?? 0 } });
      onReady();
    }
  });
  return null;
}

function Environment() {
  useEnvironment(0.45);
  return null;
}

export default function GameScene({ quality, reducedMotion, onReady, onContextLost }: { quality: GameQuality; reducedMotion: boolean; onReady: () => void; onContextLost: () => void }) {
  const heroId = useGame((s) => s.hero);
  const hero = HEROES[heroId];
  const animate = !reducedMotion;
  const moon = MOON_DIR.clone().multiplyScalar(200);
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={quality.dpr}
      gl={{ antialias: quality.antialias, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 62, near: 0.1, far: 2200, position: [0, 6, 190] }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onContextLost();
        });
      }}
      aria-hidden
    >
      <fog attach="fog" args={[NIGHT.fog, 90, 760]} />
      <hemisphereLight args={[NIGHT.hemiSky, NIGHT.hemiGround, 0.5]} />
      <directionalLight position={[moon.x, moon.y, moon.z]} intensity={0.9} color={NIGHT.moon} />
      <Environment />
      <MaterialsProvider>
        <NightSky />
        <Harbor animate={animate} />
        <Seawall />
        <Ground />
        <Buildings />
        <StreetLights />
        <ParkTrees />
        <NeonSigns animate={animate} />
        <PortfolioBillboards />
        <AviationLights />
        <CityDistricts texScale={quality.texScale} />
        <Traffic />
        <HeroAvatar key={hero.id} hero={hero} />
        <Effects hero={hero.id} />
        <HeroController />
        <ReadyGate onReady={onReady} />
      </MaterialsProvider>
      {quality.bloom && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.85} radius={0.7} />
          <Vignette offset={0.3} darkness={0.6} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
