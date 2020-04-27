import { Cache, CacheOptions, FetchOptions, Output } from "./types.ts";
import { DEFAULT_PREVIEW_LENGTH } from "../skimming.ts";
import { DEFAULT_IGNORE_CASE, DEFAULT_TRIM } from "https://raw.githubusercontent.com/petruki/skimming/master/src/skimming.ts";

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
    options: FetchOptions = {}): Output | undefined {
    const { ignoreCase, previewLength, trimContent } = options;

    const result = this.cache.filter((storedData) => {
      if (ignoreCase) {
        if (!storedData.query.toLocaleUpperCase().includes(query.toLocaleUpperCase())) {
          return false;
        }
      }

      if (storedData.query.includes(query) && storedData.exp > Date.now()) {
        if (this.checkOptions(storedData, { previewLength, ignoreCase, trimContent })) {
          return false;
        }
        return true;
      }
      return false;
    });

    if (result.length) {
      const cachedResult = result[0];
      
      // Update cache expiration time
      cachedResult.exp = Date.now() + (1000 * this.cacheExpireDuration);
      cachedResult.output.cache = true;
      return cachedResult.output;
    }

    return undefined;
  }

  store(query: string, 
    output: Output, 
    previewLength: number = DEFAULT_PREVIEW_LENGTH,
    ignoreCase: boolean = DEFAULT_IGNORE_CASE,
    trimContent: boolean = DEFAULT_TRIM): void {
    const toBeCached = {
      query,
      output,
      previewLength,
      ignoreCase,
      trimContent,
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

  /**
   * Verifies if options has been changed, if so it will gather the content from the source again
   * 
   * @param storedData 
   * @param FetchOptions 
   */
  private checkOptions(storedData: Cache, { previewLength, ignoreCase, trimContent }: FetchOptions): boolean {
    return storedData.previewLength != (previewLength != undefined ? previewLength : DEFAULT_PREVIEW_LENGTH) ||
            storedData.ignoreCase != (ignoreCase != undefined ? ignoreCase : DEFAULT_IGNORE_CASE) ||
            storedData.trimContent != (trimContent != undefined ? trimContent : DEFAULT_TRIM);
  }

  /**
   * Releases expired data from the cache
   */
  private updateCache(): void {
    this.cache = this.cache.filter((storedData) =>
      storedData.exp > Date.now()
    );
    
    this.cache = this.cache.sort((cachea: Cache, cacheb: Cache) =>
      cachea.exp > cacheb.exp ? 1 : -1
    );
  }
}