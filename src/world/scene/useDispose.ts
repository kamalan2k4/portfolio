import { useEffect } from "react";

type Disposable = { dispose: () => void } | null | undefined;

/** Frees GPU resources created outside JSX (geometries/materials passed as props) on change or unmount. */
export function useDispose(...resources: Disposable[]) {
  useEffect(
    () => () => {
      for (const r of resources) r?.dispose();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    resources,
  );
}
