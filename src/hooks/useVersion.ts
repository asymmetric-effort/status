import { useState, useEffect } from "@asymmetric-effort/specifyjs";

interface UseVersionResult {
  version: string;
}

export function useVersion(): UseVersionResult {
  const [version, setVersion] = useState("v0.0.0");

  useEffect(() => {
    let cancelled = false;

    fetch("version.json")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data?.version) {
          setVersion(data.version);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  return { version };
}
