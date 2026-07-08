import { useContext } from "react";
import LocationsContext from "./context";

export const useLocations = () => useContext(LocationsContext);

export default useLocations;
