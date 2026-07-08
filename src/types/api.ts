type Headers = HeadersInit & { authorization?: string };

export type Dictionary = Record<string, string | number | boolean | null | undefined>;

export type JsonValue = string | number | boolean | null | undefined | JsonValue[] | { [key: string]: JsonValue };

export type ApiRequestOptions = {
  url: string;
  method?: string;
  headers?: Headers;
  params?: Dictionary;
  data?: JsonValue | FormData;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  signal?: AbortSignal;
  download?: boolean;
  filename?: string;
};

export type PrivateRequest = <T>(options: ApiRequestOptions) => Promise<T>;
