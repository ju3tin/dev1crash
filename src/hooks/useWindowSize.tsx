import { useState, useEffect } from "react";


export function useWindowSize() {
  const [width, setWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Only run client-side
    const handleResize = () => setWidth(window.innerWidth);

    // Set initial value
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}
