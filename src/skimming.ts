import {
  Context,
  FetchOptions,
  Output,
  CacheOptions
} from "./lib/types.ts";
import CacheHandler from "./lib/cache.ts";
import { validateQuery, validateContext } from "./lib/utils.ts";
import { NotContentFound } from "./lib/exceptions.ts";

const LINE_BREAK = "\n";
const DEFAULT_PREVIEW_LENGTH = 200;
const DEFAULT_TRIM = true;

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

    const { ignoreCase = false } = options;
    const results: Output[] = [];

    if (this.useCache) {
      const result = this.cacheHandler.fetch(this.context, query, options);
      if (result) {
        results.push(result);
      }
    }

    for (let i = 0; i < this.context.files.length; i++) {
      const element = this.context.files[i];
      let content = await this.readDocument(this.context.url, element);

      if (ignoreCase) {
        content = content.toLowerCase();
        query = query.toLowerCase();
      }

      if (content.includes(query)) {
        const segment = this.skimContent(
          content,
          query,
          { ignoreCase: false, previewLength: options.previewLength },
        );
        const output = { file: element, segment };
        results.push(output);

        if (this.useCache) {
          this.cacheHandler.store(query, output);
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
      ignoreCase = false, 
      previewLength = DEFAULT_PREVIEW_LENGTH, 
      trimContent = DEFAULT_TRIM 
    } = options;
    const segments = [];

    if (ignoreCase) {
      content = content.toLowerCase();
      query = query.toLowerCase();
    }

    let foundIndex = content.search(query);
    while (foundIndex != -1) {
      const from = content.substring(foundIndex);

      let offset;
      if (previewLength === -1) {
        offset = from.substring(0, from.indexOf(LINE_BREAK));
      } else {
        offset = from.substring(0, previewLength === 0 ? query.length : previewLength);
      }

      const lastLine = offset.lastIndexOf(LINE_BREAK);

      /* Extract content segment from the found query to the last complete line,
       * However, if the previewLenght is shorter than the size of this line, it will display the established range.
       */
      const segment = trimContent ? offset.substring(0, lastLine > 0 ? lastLine : offset.length) : offset;
      segments.push(segment);
      content = content.replace(segment, "");
      foundIndex = content.search(query);
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
