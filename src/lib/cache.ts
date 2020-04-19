import { Cache, CacheOptions, Input, FetchOptions, Output } from "./types.ts";

const DEFAULT_CACHE_SIZE = 60;
const DEFAULT_CACHE_DURATION = 60; // 1 min

export default class CacheHandler {
  cache: Cache[] = [];
  cacheExpireDuration: number = DEFAULT_CACHE_DURATION;
  cacheSize: number = DEFAULT_CACHE_SIZE;

  constructor(cacheOptions: CacheOptions) {
    this.cacheExpireDuration = cacheOptions.expireDuration;
    this.cacheSize = cacheOptions.size;
  }

  fetch(
    input: Input,
    query: string,
    options: FetchOptions = {},
  ): Output | undefined {
    const { ignoreCase = false } = options;

    const result = this.cache.filter((storedData) => {
      if (ignoreCase) {
        return storedData.query.toLocaleUpperCase().includes(
          query.toLocaleUpperCase(),
        );
      }
      return storedData.query.includes(query) && storedData.exp > Date.now();
    });

    if (result.length) {
      const cachedResult = result[0];
      input.files.splice(input.files.indexOf(cachedResult.output.file), 0);

      // Update cache expiration time
      cachedResult.exp = Date.now() + (1000 * this.cacheExpireDuration);
      return cachedResult.output;
    }

    return undefined;
  }

  store(query: string, output: Output): void {
    const toBeCached = {
      query,
      output,
      exp: Date.now() + (1000 * this.cacheExpireDuration),
    };

    this.updateCache();

    if (this.cache.length < this.cacheSize) {
      this.cache.push(toBeCached);
    } else {
      this.cache.splice(0, 1);
      this.cache.push(toBeCached);
    }
  }

  private updateCache(): void {
    this.cache = this.cache.filter((storedData) =>
      storedData.exp > Date.now()
    );
    
    this.cache = this.cache.sort((cachea: Cache, cacheb: Cache) =>
      cachea.exp > cacheb.exp ? 1 : -1
    );
  }
}