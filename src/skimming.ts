import type { Context, FetchOptions, Output } from './lib/types.ts';
import { extractSegment, findFirstPos, validateContext, validateQuery } from './lib/utils.ts';
import { InvalidQuery, NonMappedInstruction, NotContentFound } from './lib/exceptions.ts';
import CacheHandler from './lib/cache.ts';

export const DEFAULT_PREVIEW_LENGTH = 200;
export const DEFAULT_TRIM = true;
export const DEFAULT_IGNORE_CASE = false;
export const DEFAULT_REGEX = false;
export const DEFAULT_NEXT = false;

/**
 * Skimming class
 */
export class Skimming {
  private useCache: boolean;
  private cacheHandler!: CacheHandler;
  private context!: Context;

  private constructor() {
    this.useCache = false;
  }

  /**
   * Initialize the Skimming object
   */
  static create(context?: Context): Skimming {
    const skimming = new Skimming();
    skimming.setContext(context);
    return skimming;
  }

  /**
   * Set the context for the Skimming object
   */
  setContext(context?: Context): void {
    if (context) {
      validateContext(context);
      this.context = context;

      if (context.cacheOptions) {
        this.cacheHandler = new CacheHandler(context.cacheOptions);
        this.useCache = true;
      }
    }
  }

  /**
   * Skim the content of the provided context
   */
  async skim(
    query: string,
    options: FetchOptions = {},
  ): Promise<Output[]> {
    validateQuery(query);
    validateContext(this.context);

    const { ignoreCase, previewLength, trimContent, skipCache } = options;
    let results: Output[] = [];

    if (this.canUseCache(skipCache)) {
      results = this.cacheHandler.fetch(query, options);
    }

    if (!results.length) {
      for (const file of this.context.files) {
        const content = await this.readDocument(this.context.url, file);

        const segment = this.skimContent(
          content,
          query,
          {
            ignoreCase,
            trimContent,
            previewLength,
            regex: options.regex,
          },
        );

        if (segment.length) {
          const output = {
            file,
            segment,
            found: segment.length,
            cache: false,
          };
          results.push(output);

          if (this.canUseCache(skipCache)) {
            this.cacheHandler.store(
              query,
              output,
              {
                previewLength,
                ignoreCase,
                trimContent,
              },
            );
          }
        }
      }
    }

    return results;
  }

  /**
   * Skim a given content using the provided params
   */
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
      regex,
    } = options;
    const segments = [];

    //prepare content if ignore case is enabled
    let contentToFetch = ignoreCase ? content.toLowerCase() : content;
    query = ignoreCase ? query.toLowerCase() : query;

    try {
      let foundIndex = findFirstPos(contentToFetch, query, trimContent, regex);
      let iterations = 0;
      while (foundIndex != -1) {
        const from = content.substring(foundIndex);
        const segment = extractSegment(from, query, previewLength, trimContent);
        segments.push(segment);
        content = content.replace(segment, '');
        contentToFetch = ignoreCase ? content.toLowerCase() : content;
        foundIndex = findFirstPos(
          contentToFetch,
          query,
          trimContent,
          regex,
          true,
        );

        // prevent crashing from non-mapped instruction
        if (iterations++ > NonMappedInstruction.MAX_ITERATION) {
          throw new NonMappedInstruction(query, options);
        }
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new InvalidQuery(e.message);
      }
    }

    return segments;
  }

  /**
   * Fetch document online located at the provided url
   */
  private async readDocument(url: string, doc: string): Promise<string> {
    const result = await fetch(`${url}/${doc}`);
    if (result?.body != null) {
      if (result.status === 200) {
        return await result.text().then((data: string) => {
          return data;
        });
      }
    }

    result.body?.cancel();
    throw new NotContentFound(url, doc);
  }

  private canUseCache(skipCache: boolean = false): boolean {
    return this.useCache && !skipCache;
  }
}
