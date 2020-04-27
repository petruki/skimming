import { Cache, CacheOptions, Context, FetchOptions, Output } from "./types.ts";
import { extractSegment } from "./utils.ts";
import { DEFAULT_PREVIEW_LENGTH, DEFAULT_IGNORE_CASE, DEFAULT_TRIM } from "../skimming.ts";

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
    query: string,
    options: FetchOptions = {},
  ): Output | undefined {
    const { ignoreCase, previewLength } = options;

    const result = this.cache.filter((storedData) => {
      if (ignoreCase) {
        if (!storedData.query.toLocaleUpperCase().includes(query.toLocaleUpperCase())) {
          return false;
        }
      }

      if (storedData.query.includes(query) && storedData.exp > Date.now()) {
        // Preview segment found in cache is smaller than the requested - should gather the content again
        if (storedData.previewLength < (previewLength || DEFAULT_PREVIEW_LENGTH)) {
          return false;
        }
        return true;
      }
      return false;
    });

    if (result.length) {
      const cachedResult = result[0];

      cachedResult.output.segment = cachedResult.output.segment.map(segment => {
        return extractSegment(segment, query, options.previewLength, options.trimContent);
      });

      // Update cache expiration time
      cachedResult.exp = Date.now() + (1000 * this.cacheExpireDuration);
      cachedResult.output.cache = true;
      return cachedResult.output;
    }

    return undefined;
  }

  store(query: string, output: Output, previewLength: number = DEFAULT_PREVIEW_LENGTH): void {
    const toBeCached = {
      query,
      output,
      previewLength,
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