import { useContext } from "react";
import DepartmentsContext from "./context";

export default function useDepartments() {
  return useContext(DepartmentsContext);
}
