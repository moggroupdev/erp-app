export type ContextProps<T> = {
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  loading: boolean;
  error: string;
  reload: () => void;
};

export type Pagination = {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedData<T> = {
  results: number;
  pagination: Pagination;
  data: T[];
};
