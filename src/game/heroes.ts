import { MIXAMO_PROFILE, type RigProfile } from "./rig/mixamoRig";
import { SPIDER_PROFILE } from "./rig/profiles";

export type HeroId = "spiderman" | "ironman" | "cap";

export type HeroDef = {
  id: HeroId;
  name: string;
  tagline: string;
  accent: string;
  model: string;
  profile: RigProfile;
  /** Runtime costume applied over the shared athletic model. */
  costume?: "cap";
  height: number;
  powers: string[];
  controls: [string, string][];
};

const COMMON: [string, string][] = [
  ["WASD", "Move"],
  ["Mouse", "Look (click to lock the cursor)"],
  ["F", "Drive / leave a car"],
  ["E", "Open the nearby portfolio district"],
  ["V", "Slow motion"],
];

export const HEROES: Record<HeroId, HeroDef> = {
  spiderman: {
    id: "spiderman",
    name: "Spider-Man",
    tagline: "Swing the skyline. Every rooftop is a launch pad.",
    accent: "#ff3b3b",
    model: "/dev-assets/heroes/spiderman.glb",
    profile: SPIDER_PROFILE,
    height: 1.8,
    powers: ["Web-swinging between buildings", "Acrobatic flips and three-point landings", "Wall-crawling up any tower", "Web-zip to any point"],
    controls: [["Space", "Jump · hold in the air to web-swing"], ["Click", "Web-zip to the reticle"], ["Shift", "Sprint"], ["W at a wall", "Climb"], ...COMMON],
  },
  ironman: {
    id: "ironman",
    name: "Iron Man",
    tagline: "Mach speed over the city. Repulsors hot.",
    accent: "#ffb020",
    model: "/dev-assets/heroes/ironman.glb",
    profile: MIXAMO_PROFILE,
    height: 1.95,
    powers: ["Full flight with afterburner boost", "Repulsor blasts", "Unibeam", "Ram through anything: harder the faster you fly"],
    controls: [["Space / Ctrl", "Fly up / down (Space on the ground takes off)"], ["Shift", "Afterburner"], ["Click", "Repulsor blast"], ["Right-click", "Unibeam"], ...COMMON],
  },
  cap: {
    id: "cap",
    name: "Captain America",
    tagline: "Super-soldier. The shield always comes back.",
    accent: "#3b6bff",
    model: "/dev-assets/heroes/spiderman.glb",
    profile: SPIDER_PROFILE,
    costume: "cap",
    height: 1.88,
    powers: ["Super-soldier sprint and leaps", "Ricocheting shield throw", "Double-jump flips", "Shield charge"],
    controls: [["Space", "Jump · again in the air to flip"], ["Click", "Throw the shield"], ["Right-click", "Shield charge"], ["Shift", "Sprint"], ...COMMON],
  },
};

export const HERO_ORDER: HeroId[] = ["spiderman", "ironman", "cap"];
