export type Address = {
  id: string;
  countryId: string;
  cityId: string | null; // Null if country is not Egypt
  addressLine: string | null;
  isDefault: boolean;
};
