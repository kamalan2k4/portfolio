import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { type Material, type Mesh, MeshStandardMaterial, type Object3D, PMREMGenerator, type Vector3, type WebGLProgramParametersWithUniforms } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { HeroDef } from "../heroes";
import { MixamoRig } from "./mixamoRig";

const cache = new Map<string, Promise<GLTF>>();

function loadGltf(url: string) {
  let p = cache.get(url);
  if (!p) {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    p = loader.loadAsync(url);
    cache.set(url, p);
  }
  return p;
}

export type HeroModel = {
  scene: Object3D;
  rig: MixamoRig;
  /** Scale that brings the model to the hero's height. */
  fit: number;
  /** Pelvis at rest, the body's pivot. */
  pelvis: Vector3;
  /** Feet height below the pelvis at rest, in model units. */
  feet: number;
};

/**
 * Captain America's costume, painted over the shared athletic model in its own (bind-pose)
 * space: navy suit, white chest star, red-and-white abdomen stripes, red gloves and boots.
 * Mesh space for this model: -X is the front, Y is up, Z is across the shoulders.
 */
function applyCapCostume(material: MeshStandardMaterial) {
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBind;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBind = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBind;")
      .replace(
        "#include <map_fragment>",
        /* glsl */ `#include <map_fragment>
        {
          vec3 p = vBind;
          float detail = clamp(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)) * 1.8, 0.55, 1.15);
          vec3 navy = vec3(0.08, 0.13, 0.32);
          vec3 red = vec3(0.62, 0.06, 0.07);
          vec3 white = vec3(0.86, 0.87, 0.9);
          vec3 suit = navy;
          // Abdomen: vertical red/white stripes on the front and back.
          float abdomen = step(0.98, p.y) * step(p.y, 1.24) * step(abs(p.z), 0.16);
          suit = mix(suit, mix(red, white, step(0.5, fract(p.z * 13.0))), abdomen);
          // Chest star (five points), front only.
          vec2 q = vec2(p.z, p.y - 1.4);
          float a = atan(q.x, q.y);
          float r = length(q);
          float star = 0.045 + 0.03 * cos(a * 5.0);
          suit = mix(suit, white, step(r, star) * step(p.x, -0.02));
          // Gloves and boots.
          suit = mix(suit, red, step(0.43, abs(p.z)));
          suit = mix(suit, red, 1.0 - step(0.5, p.y));
          // Helmet with a white "A" on the forehead.
          float head = step(1.62, p.y);
          vec2 f = vec2(p.z, p.y - 1.82);
          float letterA = step(abs(abs(f.x) - (0.035 - f.y * 0.55)), 0.008) * step(-0.03, f.y) * step(f.y, 0.05) + step(abs(f.y + 0.0), 0.006) * step(abs(f.x), 0.03);
          suit = mix(suit, white, clamp(letterA, 0.0, 1.0) * head * step(p.x, -0.02));
          diffuseColor.rgb = suit * detail;
        }`,
      );
  };
  material.customProgramCacheKey = () => "cap-costume";
}

/** Loads (once) and clones the hero's rigged model, normalised to the hero's height. */
export function useHeroModel(hero: HeroDef): HeroModel | null {
  const [model, setModel] = useState<HeroModel | null>(null);
  useEffect(() => {
    let alive = true;
    let scene: Object3D | null = null;
    loadGltf(hero.model)
      .then((gltf) => {
        if (!alive) return;
        scene = cloneSkinned(gltf.scene);
        scene.traverse((o) => {
          o.frustumCulled = false;
          const mesh = o as Mesh;
          if (!mesh.isMesh) return;
          if (hero.costume === "cap") {
            const m = (mesh.material as MeshStandardMaterial).clone();
            applyCapCostume(m);
            mesh.material = m;
          }
        });
        const rig = new MixamoRig(scene, hero.profile);
        const top = rig.restPosition("HeadTop_End");
        const feet = Math.min(rig.restPosition("LeftToeBase").y, rig.restPosition("RightToeBase").y);
        const fit = hero.height / Math.max(1e-6, (top.y - feet) * 1.04);
        const pelvis = rig.restPosition("Hips");
        setModel({ scene, rig, fit, pelvis, feet: pelvis.y - feet });
      })
      .catch((e) => console.error(`hero model failed: ${hero.model}`, e));
    return () => {
      alive = false;
      // Cloned materials (costume) are ours to free; shared geometry/textures stay cached.
      scene?.traverse((o) => {
        const mesh = o as Mesh;
        if (mesh.isMesh && hero.costume) (mesh.material as Material).dispose();
      });
      setModel(null);
    };
  }, [hero]);
  return model;
}

/** Studio-style reflections for metal (Iron Man's armour), generated once per renderer. */
export function useEnvironment(intensity = 0.6) {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { gl, scene } = get();
    const pmrem = new PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [get, intensity]);
}
