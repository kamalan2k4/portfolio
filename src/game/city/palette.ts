import { Color, Vector3 } from "three";

/** Night-city palette shared by sky, fog, lights, buildings and water. */
export const MOON_DIR = new Vector3(-0.45, 0.62, -0.64).normalize();
export const NIGHT = {
  zenith: new Color("#03060f"),
  horizon: new Color("#2a1c4d"),
  glow: new Color("#ff6a4d"),
  fog: new Color("#151b36"),
  moon: new Color("#d6e6ff"),
  hemiSky: new Color("#6878b8"),
  hemiGround: new Color("#1e1b26"),
};
export const NEON = ["#ff3df2", "#25e6ff", "#ffb020", "#7cff6b", "#ff4d6d", "#8a7dff"];
