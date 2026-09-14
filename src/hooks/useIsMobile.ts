"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

/** Returns whether the current viewport is narrower than the mobile breakpoint. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    let frameId: number | undefined;

    const update = () => {
      frameId = undefined;
      setIsMobile(mediaQuery.matches);
    };

    const handleChange = () => {
      if (frameId === undefined) frameId = window.requestAnimationFrame(update);
    };

    update();
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return isMobile;
}
