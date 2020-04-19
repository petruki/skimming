import {
  Input,
  FetchOptions,
  Output,
  CacheOptions
} from "./lib/types.ts";
import CacheHandler from "./lib/cache.ts";

const DEFAULT_PREVIEW_LENGTH = 200;
const DEFAULT_TRIM = true;

export default class Skimming {
  useCache: boolean = false;
  private cacheHandler!: CacheHandler;

  constructor(cacheOptions?: CacheOptions) {
    if (cacheOptions) {
      this.cacheHandler = new CacheHandler(cacheOptions);
      this.useCache = true;
    }
  }

  async skim(
    input: Input,
    query: string,
    options: FetchOptions = {},
  ): Promise<Output[]> {
    const { ignoreCase = false } = options;
    const results: Output[] = [];

    if (this.useCache) {
      const result = this.cacheHandler.fetch(input, query, options);
      if (result) {
        results.push(result);
      }
    }

    for (let index = 0; index < input.files.length; index++) {
      const element = input.files[index];
      let content = await this.readDocument(input.url, element);

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
    const { ignoreCase = false, previewLength = DEFAULT_PREVIEW_LENGTH, trimContent = DEFAULT_TRIM } =
      options;
    const segments = [];

    if (ignoreCase) {
      content = content.toLowerCase();
      query = query.toLowerCase();
    }

    let foundIndex = content.search(query);
    while (foundIndex != -1) {
      const from = content.substring(foundIndex);
      const offset = from.substring(0, previewLength);
      const lastLine = offset.lastIndexOf("\n");
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
      return await result.body.text().then((data: string) => {
        return data;
      });
    }
    return '';
  }
}
