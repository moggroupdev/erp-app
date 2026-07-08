"use client";

import { useEffect, useCallback } from "react";
import { useLocale } from "@/lib/i18n/hooks";
import { type Department } from "@/types/departments";
import useDataHandler from "@/hooks/use-data-handler";
import handleRequest from "@/lib/helpers/handle-request";
import departmentsApi from "@/lib/api/departments";
import DepartmentsContext from "./context";

export default function DepartmentsProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  const { loading, setLoading, error, setError, data, setData } = useDataHandler<Department[]>({
    initialData: [],
    initialLoading: true,
  });

  const getDepartments = useCallback(() => {
    handleRequest(locale, setLoading, setError, async () => {
      setData(await departmentsApi.list());
    });
  }, [locale, setLoading, setError, setData]);

  useEffect(() => {
    getDepartments();
  }, [getDepartments]);

  return (
    <DepartmentsContext.Provider value={{ data, setData, loading, error, reload: getDepartments }}>
      {children}
    </DepartmentsContext.Provider>
  );
}
