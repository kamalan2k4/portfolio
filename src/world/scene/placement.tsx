"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { destinationById } from "@/content/destinations";
import type { DistrictId } from "@/content/types";
import { registerColliders, type Collider } from "../terrain";

/**
 * Where each district stands and how its footprint is registered for collision.
 * The eco-park world uses the destination data directly; the city game provides its own
 * layout, so the same district architecture can be reused in both worlds.
 */
export type Placement = { position: [number, number]; viewpoint: [number, number]; lookHeight?: number };
export type WorldLayout = {
  place: (id: DistrictId) => Placement;
  register: (list: Collider[]) => () => void;
};

const ECO_PARK: WorldLayout = { place: (id) => destinationById(id), register: registerColliders };

const LayoutContext = createContext<WorldLayout>(ECO_PARK);

export function LayoutProvider({ layout, children }: { layout: WorldLayout; children: ReactNode }) {
  return <LayoutContext.Provider value={layout}>{children}</LayoutContext.Provider>;
}

export const useLayout = () => useContext(LayoutContext);
export const usePlacement = (id: DistrictId) => useContext(LayoutContext).place(id);

/** Registers circular building footprints for the lifetime of the component. */
export function useColliders(list: Collider[]) {
  const { register } = useLayout();
  const key = JSON.stringify(list);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => register(list), [key, register]);
}
