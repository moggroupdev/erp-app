"use client";

import { useEffect } from "react";
import useUser from "@/contexts/user/hook";
import { useLocale } from "@/lib/i18n/hooks";
import { type Department } from "@/types/departments";
import useDataHandler from "@/hooks/use-data-handler";
import handleRequest from "@/lib/helpers/handle-request";
import departmentsApi from "@/lib/api/departments";
import DepartmentsContext from "./context";

export default function DepartmentsProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const { isInitializing, user } = useUser();

  const { privateRequest, loading, setLoading, error, setError, data, setData } = useDataHandler<Department[]>({
    initialData: [],
    initialLoading: true,
  });

  function getDepartments() {
    handleRequest(locale, setLoading, setError, async () => {
      setData(await departmentsApi.list({ privateRequest }));
    });
  }

  useEffect(() => {
    if (isInitializing) return;
    if (!user) return setLoading(false);

    getDepartments();
  }, [isInitializing, user]);

  return (
    <DepartmentsContext.Provider value={{ data, setData, loading, error, reload: getDepartments }}>
      {children}
    </DepartmentsContext.Provider>
  );
}
