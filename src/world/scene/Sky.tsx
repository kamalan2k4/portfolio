import { useMemo } from "react";
import { BackSide, ShaderMaterial } from "three";
import { COLORS, SUN_DIR } from "./palette";
import { useDispose } from "./useDispose";

/** Procedural golden-hour sky dome: gradient + sun disc + glow. No textures. */
export function Sky() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          zenith: { value: COLORS.zenith },
          horizon: { value: COLORS.horizon },
          haze: { value: COLORS.haze },
          sun: { value: COLORS.sun },
          sunDir: { value: SUN_DIR },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 zenith, horizon, haze, sun, sunDir;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 col = mix(horizon, zenith, pow(clamp(h, 0.0, 1.0), 0.45));
            col = mix(col, haze, smoothstep(0.02, -0.15, h));
            float s = max(dot(d, sunDir), 0.0);
            col += sun * (pow(s, 900.0) * 6.0 + pow(s, 24.0) * 0.45 + pow(s, 4.0) * 0.12);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useDispose(material);
  return (
    <mesh material={material} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[900, 32, 16]} />
    </mesh>
  );
}
