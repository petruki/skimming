export type Input = {
  url: string;
  files: string[];
};

export type Output = {
  file: string;
  segment: string[];
};

export type FetchOptions = {
  ignoreCase?: boolean;
  trimContent?: boolean;
  previewLength?: number;
};

export type Cache = {
  query: string;
  output: Output;
  exp: number;
};

export type CacheOptions = {
  size: number;
  expireDuration: number; // seconds
};
