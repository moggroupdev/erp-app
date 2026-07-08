import { createContext } from "react";
import type { DepartmentsContextProps } from "@/types/departments";

const DepartmentsContext = createContext<DepartmentsContextProps>({
  data: [],
  setData: () => {},
  loading: false,
  error: "",
  reload: () => {},
});

export default DepartmentsContext;
