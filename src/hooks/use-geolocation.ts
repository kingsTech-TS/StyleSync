"use client";

import { useEffect, useState } from "react";

export type GeoState =
  | { status: "idle" | "pending" }
  | { status: "granted"; lat: number; lon: number }
  | { status: "denied" | "unavailable" };

/** Asks for the browser location once when `enabled` turns true. */
export function useGeolocation(enabled: boolean): GeoState {
  const [state, setState] = useState<GeoState>({ status: "idle" });

  useEffect(() => {
    if (!enabled || state.status !== "idle") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unavailable" });
      return;
    }
    setState({ status: "pending" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: "granted",
          // ~1 km precision is all the weather lookup needs.
          lat: Math.round(pos.coords.latitude * 100) / 100,
          lon: Math.round(pos.coords.longitude * 100) / 100,
        }),
      () => setState({ status: "denied" }),
      { maximumAge: 30 * 60_000, timeout: 8000 },
    );
  }, [enabled, state.status]);

  return state;
}
