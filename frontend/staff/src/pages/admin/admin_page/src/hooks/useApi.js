import { useState, useCallback, useRef, useEffect } from 'react';

export function useApi(fn, immediate = false) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        const msg = err?.response?.data?.message || err?.message || 'Server xatosi';
        setError(msg);
        setLoading(false);
      }
      throw err;
    }
  }, [fn]);

  return { data, loading, error, execute, setData };
}
