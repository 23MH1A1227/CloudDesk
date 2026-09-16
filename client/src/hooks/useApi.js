import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async fetcher and tracks loading/error/data.
 * `deps` controls when it re-runs; `refetch` re-runs it on demand.
 */
export default function useApi(fetcher, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mounted.current) setData(result);
      return result;
    } catch (err) {
      if (mounted.current) setError(err);
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, immediate]);

  return { data, loading, error, refetch: run, setData };
}
