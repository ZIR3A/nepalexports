import { useLocation } from "@/context/LocationContext";
import { useCallback } from "react";

export function useApi() {
  const { warehouseId } = useLocation();

  const fetchApi = useCallback(async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    
    // Inject the selected warehouse ID into every API request header
    if (warehouseId) {
      headers.set("x-warehouse-id", warehouseId);
    }
    
    return fetch(url, {
      ...options,
      headers,
    });
  }, [warehouseId]);

  return fetchApi;
}
