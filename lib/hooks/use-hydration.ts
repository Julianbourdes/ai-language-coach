/**
 * Hook to avoid hydration mismatch with Zustand persist
 */

import { useEffect, useState } from "react";

/**
 * Returns true only after component is mounted on client
 * This prevents hydration mismatches with localStorage-persisted state
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
