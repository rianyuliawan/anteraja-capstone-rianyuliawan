import { usePublicApi } from "./usePublicApi";

const BASE_URL = "https://www.emsifa.com/api-wilayah-indonesia/v2";

export function useProvinces() {
  const provinces = usePublicApi(`${BASE_URL}/provinces.json`);
  return {
    provinces: provinces.data?.data ?? [],
    isLoadingProvinces: provinces.isLoading,
    provincesError: provinces.error,
    retryProvinces: provinces.retry,
  };
}

export function useRegencies(provinceId) {
  const regencies = usePublicApi(
    provinceId ? `${BASE_URL}/regencies/${provinceId}.json` : null,
  );
  return {
    regencies: regencies.data?.data ?? [],
    isLoadingRegencies: regencies.isLoading,
    regenciesError: regencies.error,
    retryRegencies: regencies.retry,
  };
}
