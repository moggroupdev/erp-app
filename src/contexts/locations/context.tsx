import { createContext } from "react";
import { LocationsContextProps } from "@/types/locations";

const LocationsContext = createContext<LocationsContextProps>({
  data: null,
  setData: () => {},
  loading: false,
  error: "",
  reload: () => {},
});

export default LocationsContext;
