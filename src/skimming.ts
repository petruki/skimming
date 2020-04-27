import {
  Context,
  FetchOptions,
  Output,
  CacheOptions
} from "./lib/types.ts";
import CacheHandler from "./lib/cache.ts";
import { REGEX_ESCAPE, validateQuery, validateContext, extractSegment } from "./lib/utils.ts";
import { NotContentFound, InvalidQuery } from "./lib/exceptions.ts";

export const DEFAULT_PREVIEW_LENGTH = 200;
export const DEFAULT_TRIM = true;
export const DEFAULT_IGNORE_CASE = false;
export const DEFAULT_REGEX = false;

export default class Skimming {
  useCache: boolean = false;
  private cacheHandler!: CacheHandler;
  private context!: Context;

  constructor(cacheOptions?: CacheOptions) {
    if (cacheOptions) {
      this.cacheHandler = new CacheHandler(cacheOptions);
      this.useCache = true;
    }
  }

  setContext(context: Context): void {
    validateContext(context);
    this.context = context;
  }

  async skim(
    query: string,
    options: FetchOptions = {},
  ): Promise<Output[]> {
    validateQuery(query);

    const { ignoreCase, previewLength, trimContent } = options;
    const results: Output[] = [];

    let result: Output | undefined;
    if (this.useCache) {
      result = this.cacheHandler.fetch(query, options);
      if (result) {
        results.push(result);
      }
    }

    if (!result) {
      for (let i = 0; i < this.context.files.length; i++) {
        const element = this.context.files[i];
        let content = await this.readDocument(this.context.url, element);
  
        const segment = this.skimContent(
          content,
          query,
          { 
            ignoreCase, 
            trimContent, 
            previewLength,
            regex: options.regex
          },
        );
        const output = { file: element, segment, found: segment.length, cache: false };
        results.push(output);

        if (this.useCache) {
          this.cacheHandler.store(query, output, previewLength, ignoreCase, trimContent);
        }
      }
    }

    return results;
  }

  skimContent(
    content: string,
    query: string,
    options: FetchOptions = {},
  ): string[] {
    validateQuery(query);
    
    const { 
      ignoreCase, 
      previewLength, 
      trimContent,
      regex
    } = options;
    const segments = [];

    let contentToFetch = ignoreCase ? content.toLowerCase() : content;
    query = ignoreCase ? query.toLowerCase() : query;

    try {
      let foundIndex = regex ? contentToFetch.search(query) : contentToFetch.search(query.replace(REGEX_ESCAPE, '\\$&'));
      while (foundIndex != -1) {
        const from = content.substring(foundIndex);
        const segment = extractSegment(from, query, previewLength, trimContent);
        segments.push(segment);
        content = content.replace(segment, "");
        contentToFetch = ignoreCase ? content.toLowerCase() : content;
        foundIndex = regex ? contentToFetch.search(query) : contentToFetch.search(query.replace(REGEX_ESCAPE, '\\$&'));
      }
    } catch (e) {
      if (e instanceof SyntaxError)
        throw new InvalidQuery(e.message);
    }

    return segments;
  }

  private async readDocument(url: string, doc: string): Promise<string> {
    const result = await fetch(`${url}${doc}`);
    if (result != null && result.body != null) {
      if (result.status === 200) {
        return await result.body.text().then((data: string) => {
          return data;
        });
      }
    }
    throw new NotContentFound(url, doc);
  }
}
