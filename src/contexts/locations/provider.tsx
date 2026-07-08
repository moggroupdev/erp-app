"use client";

import { useEffect, useCallback } from "react";
import { useLocale } from "@/lib/i18n/hooks";
import useDataHandler from "@/hooks/use-data-handler";
import handleRequest from "@/lib/helpers/handle-request";
import locationsApi from "@/lib/api/locations";
import { Locations } from "@/types/locations";
import LocationContext from "./context";

export default function LocationsProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  const { loading, setLoading, error, setError, data, setData } = useDataHandler<Locations | null>({
    initialData: null,
    initialLoading: true,
  });

  const getLocations = useCallback(() => {
    handleRequest(locale, setLoading, setError, async () => {
      setData(await locationsApi.listAll());
    });
  }, [locale, setLoading, setError, setData]);

  useEffect(() => {
    getLocations();
  }, [getLocations]);

  return (
    <LocationContext.Provider value={{ data, setData, loading, error, reload: getLocations }}>
      {children}
    </LocationContext.Provider>
  );
}
