import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { facilityConfigApi } from '@/services/api';

const FacilityConfigContext = createContext(null);

export function FacilityConfigProvider({ children }) {
  const [config, setConfig] = useState({
    hasOnsiteLab: true,
    hasOnsitePharmacy: true,
    hasOnsiteRadiology: true,
    locationId: null,
    locationName: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async (locationId) => {
    setLoading(true);
    setError(null);
    try {
      if (!facilityConfigApi?.getConfig) {
        setLoading(false);
        return;
      }
      const res = await facilityConfigApi.getConfig(locationId);
      const data = res?.data || res;
      setConfig({
        hasOnsiteLab: data.hasOnsiteLab ?? true,
        hasOnsitePharmacy: data.hasOnsitePharmacy ?? true,
        hasOnsiteRadiology: data.hasOnsiteRadiology ?? true,
        locationId: data.locationId ?? null,
        locationName: data.locationName ?? null,
      });
    } catch (e) {
      setError(e.message || 'Failed to load facility config');
      setConfig({
        hasOnsiteLab: true,
        hasOnsitePharmacy: true,
        hasOnsiteRadiology: true,
        locationId: null,
        locationName: null,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const value = {
    ...config,
    loading,
    error,
    refetch: fetchConfig,
  };

  return (
    <FacilityConfigContext.Provider value={value}>
      {children}
    </FacilityConfigContext.Provider>
  );
}

export function useFacilityConfig() {
  const ctx = useContext(FacilityConfigContext);
  if (!ctx) {
    return {
      hasOnsiteLab: true,
      hasOnsitePharmacy: true,
      hasOnsiteRadiology: true,
      loading: false,
      error: null,
      refetch: async () => {},
    };
  }
  return ctx;
}
