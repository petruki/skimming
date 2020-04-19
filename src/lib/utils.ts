import { Context } from "./types.ts";
import { InvalidQuery, InvalidContext } from "./exceptions.ts";

export function validateQuery(query: string, limit?: number): void {
  if (!query.length) {
    throw new InvalidQuery("it is empty");
  }

  if (limit && query.length > limit) {
    throw new InvalidQuery(`it exceeds the limit of ${limit}`);
  }
}

export function validateContext(context: Context): void {
  if (!context.url.length) {
    throw new InvalidContext("url is empty");
  }

  context.files.forEach(file => {
    if (!file.length) {
      throw new InvalidContext("file name is empty");
    } else {
      if (!context.url.endsWith("/") && !file.startsWith("/")) {
        throw new InvalidContext(`this enpoint might not work: ${context.url}${file}`);
      }
    }
  });
}