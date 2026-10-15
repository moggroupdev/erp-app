export type ContactPerson = {
  id: string;
  name: string;
  jobTitle: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
};
