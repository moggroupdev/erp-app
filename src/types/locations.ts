import { ContextProps } from "./global";

export type Country = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
};

export type Governorate = {
  id: string;
  nameEn: string;
  nameAr: string;
  // No countryId as governorates are Egypt-only
};

export type City = {
  id: string;
  governorateId: string;
  nameEn: string;
  nameAr: string;
};

export type Locations = {
  countries: Country[];
  governorates: Governorate[];
  cities: City[];
};

// ==================== Context ====================

export type LocationsContextProps = ContextProps<Locations | null>;
