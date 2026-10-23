import { Color, Vector3 } from "three";

/** Golden-hour palette shared by sky, fog, lights and materials. */
export const SUN_DIR = new Vector3(-0.78, 0.3, 0.42).normalize();
export const COLORS = {
  zenith: new Color("#2b5a6e"),
  horizon: new Color("#f1c48c"),
  haze: new Color("#cdb08a"),
  fog: new Color("#b9a68a"),
  sun: new Color("#ffd9a0"),
  hemiSky: new Color("#bfe0e6"),
  hemiGround: new Color("#3b4a2c"),
  stone: new Color("#d9cfba"),
  stoneDark: new Color("#9d9481"),
  glass: new Color("#a9ded3"),
  aqua: new Color("#7dd3c0"),
  amber: new Color("#f2b45a"),
};
