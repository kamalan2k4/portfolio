import { useMemo } from "react";
import { destinations } from "@/content/destinations";
import type { DistrictId } from "@/content/types";
import { AIDome, CreatorBay, InnovationDistrict, KnowledgeFalls, LaunchTerminal, ProductCity } from "@/world/scene/Districts";
import { ArrivalGate, Beacon, Citadel, Nexus } from "@/world/scene/Landmarks";
import { LayoutProvider, type WorldLayout } from "@/world/scene/placement";
import { BLOCK, blockCenter, DISTRICT_BLOCKS, PLAZA_HEIGHT, registerCylinders } from "./layout";

/** Where each portfolio district stands in the city: the centre of its block, approached from the south. */
export function cityPlacement(id: DistrictId) {
  const [x, z] = blockCenter(...DISTRICT_BLOCKS[id]);
  return { position: [x, z] as [number, number], viewpoint: [x, z + 15] as [number, number], lookHeight: id === "citadel" ? 10 : 4 };
}

/** Landmark footprints become solid cylinders; height is estimated from footprint size. */
const CITY_LAYOUT: WorldLayout = {
  place: cityPlacement,
  register: (list) => registerCylinders(list.map((c) => ({ ...c, top: PLAZA_HEIGHT + (c.r <= 1 ? 4 : c.r >= 6 ? 20 : 7) }))),
};

/** The portfolio districts, reusing the eco-park architecture on raised city plazas. */
export function CityDistricts({ texScale }: { texScale: number }) {
  const plazas = useMemo(
    () =>
      destinations.map((d) => {
        const [x, z] = cityPlacement(d.id).position;
        return { id: d.id, x, z, accent: d.accent };
      }),
    [],
  );
  const size = BLOCK - 2;
  return (
    <LayoutProvider layout={CITY_LAYOUT}>
      {plazas.map((p) => (
        <group key={p.id} position={[p.x, 0, p.z]}>
          <mesh position={[0, PLAZA_HEIGHT / 2, 0]}>
            <boxGeometry args={[size, PLAZA_HEIGHT, size]} />
            <meshStandardMaterial color="#22232b" roughness={0.55} metalness={0.2} />
          </mesh>
          <mesh position={[0, PLAZA_HEIGHT + 0.01, 0]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[(size / 2 - 0.6) * Math.SQRT2, (size / 2 - 0.25) * Math.SQRT2, 4, 1, Math.PI / 4]} />
            <meshBasicMaterial color={p.accent} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <ArrivalGate shadows={false} />
      <Nexus shadows={false} />
      <Citadel shadows={false} />
      <AIDome shadows={false} texScale={texScale} />
      <InnovationDistrict shadows={false} texScale={texScale} />
      <ProductCity shadows={false} texScale={texScale} />
      <CreatorBay shadows={false} texScale={texScale} />
      <KnowledgeFalls shadows={false} />
      <LaunchTerminal shadows={false} />
      {destinations
        .filter((d) => d.id !== "nexus" && d.id !== "arrival")
        .map((d) => (
          <Beacon key={d.id} id={d.id} />
        ))}
    </LayoutProvider>
  );
}
