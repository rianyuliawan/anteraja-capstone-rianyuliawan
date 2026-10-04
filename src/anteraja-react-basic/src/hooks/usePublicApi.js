import { useEffect, useState } from "react";

// Satu tempat untuk loading, error, dan pembatalan request saat komponen berubah.
export function usePublicApi(url) {
  const [result, setResult] = useState({ url: null, data: null, error: "" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => setResult({ url, data, error: "" }))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setResult({ url, data: null, error: error.message });
        }
      });

    return () => controller.abort();
  }, [url, retry]);

  return {
    data: result.url === url ? result.data : null,
    isLoading: Boolean(url) && result.url !== url,
    isError: Boolean(url) && result.url === url && Boolean(result.error),
    error: result.url === url ? result.error : "",
    retry: () => {
      setResult({ url: null, data: null, error: "" });
      setRetry((current) => current + 1);
    },
  };
}
