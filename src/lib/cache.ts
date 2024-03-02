import type { Cache, CacheOptions, FetchOptions, Output } from './types.ts';
import { DEFAULT_IGNORE_CASE, DEFAULT_PREVIEW_LENGTH, DEFAULT_TRIM } from '../skimming.ts';

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

  /**
   * Fetch content in memory
   */
  fetch(
    query: string,
    options: FetchOptions = {},
  ): Output[] {
    const { ignoreCase, previewLength, trimContent } = options;

    const result = this.fetchCache(
      query,
      {
        ignoreCase,
        previewLength,
        trimContent,
      },
    );

    if (result.length) {
      const cachedResult = result[0];
      cachedResult.query = query;
      cachedResult.output = cachedResult.output.filter((output) => {
        output.cache = true;
        output.segment = output.segment.filter((segment) => {
          if (ignoreCase) {
            return segment.toLowerCase().indexOf(query.toLowerCase()) >= 0;
          }

          return segment.indexOf(query) >= 0;
        });

        return output.segment.length;
      });

      // Update cache expiration time
      cachedResult.exp = Date.now() + (1000 * this.cacheExpireDuration);
      return cachedResult.output;
    }
    return [];
  }

  /**
   * Stores result in memory
   */
  store(
    query: string,
    output: Output,
    fetchOptions?: FetchOptions,
  ): void {
    const cachedData = this.cache.filter((cache) => cache.query === query);

    if (cachedData.length) {
      cachedData[0].output = cachedData[0].output.filter((cachedOutput) => cachedOutput.file != output.file);
      cachedData[0].output.push(output);
      cachedData[0].exp = Date.now() + (1000 * this.cacheExpireDuration);
      cachedData[0].previewLength = fetchOptions?.previewLength ?? DEFAULT_PREVIEW_LENGTH;
      cachedData[0].trimContent = fetchOptions?.trimContent ?? DEFAULT_TRIM;
      cachedData[0].ignoreCase = fetchOptions?.ignoreCase ?? DEFAULT_IGNORE_CASE;
    } else {
      const toBeCached = {
        query,
        output: [output],
        previewLength: fetchOptions?.previewLength ?? DEFAULT_PREVIEW_LENGTH,
        ignoreCase: fetchOptions?.ignoreCase ?? DEFAULT_IGNORE_CASE,
        trimContent: fetchOptions?.trimContent ?? DEFAULT_TRIM,
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
  }

  /**
   * Fetches cache based on query input and options provided
   *
   * @param query
   * @param fetchOptions
   * @returns
   */
  private fetchCache(
    query: string,
    fetchOptions: FetchOptions,
  ): Cache[] {
    const { ignoreCase, previewLength, trimContent } = fetchOptions;

    return this.cache.filter((storedData) => {
      if (storedData.query.length <= query.length && storedData.exp > Date.now()) {
        const hasOptionsChanged = this.checkOptions(storedData, {
          previewLength,
          ignoreCase,
          trimContent,
        });

        if (ignoreCase) {
          return query.toLowerCase().startsWith(storedData.query.toLowerCase()) && !hasOptionsChanged;
        }

        if (query.startsWith(storedData.query)) {
          return !hasOptionsChanged;
        }
      }
      return false;
    });
  }

  /**
   * Verifies if options has been changed, if so it will fetch the content from the source again
   *
   * @param storedData
   * @param FetchOptions
   */
  private checkOptions(
    storedData: Cache,
    { previewLength, ignoreCase, trimContent }: FetchOptions,
  ): boolean {
    return storedData.previewLength !== (previewLength ?? DEFAULT_PREVIEW_LENGTH) ||
      storedData.ignoreCase !== (ignoreCase ?? DEFAULT_IGNORE_CASE) ||
      storedData.trimContent !== (trimContent ?? DEFAULT_TRIM);
  }

  /**
   * Releases expired data from the cache
   */
  private updateCache(): void {
    this.cache = this.cache.filter((storedData) => storedData.exp > Date.now());

    this.cache.sort((cachea: Cache, cacheb: Cache) => cachea.exp > cacheb.exp ? 1 : -1);
  }
}
