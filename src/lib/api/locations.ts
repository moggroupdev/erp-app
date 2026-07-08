import apiRequest from "@/lib/helpers/api-request";
import type { Locations } from "@/types/locations";

const locationsApi = {
  async listAll() {
    return await apiRequest<Locations>({ url: "locations" });
  },
};

export default locationsApi;
